// MODE DÉMO : un remplaçant du backend Express qui tourne entièrement dans le navigateur.
//
// Pourquoi ? https://fhemt.me est servi par GitHub Pages, qui n'héberge que des fichiers
// statiques. Cette classe offre exactement les mêmes méthodes qu'ApiService (api.ts) — le
// compilateur le vérifie grâce à `implements ApiContract` —, lit les mêmes fichiers seed
// (public/demo/*.json, copiés depuis backend/data/seed) et applique les mêmes règles que
// backend/src/services/*.js. Les données modifiées (progression, profils, questions créées,
// messages) sont gardées dans le localStorage : chaque visiteur a son propre bac à sable.
//
// app.config.ts choisit cette classe à la place d'ApiService quand environment.apiUrl est vide.
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, forkJoin, of, throwError } from 'rxjs';
import { delay, map, shareReplay, switchMap } from 'rxjs/operators';
import { ApiContract } from './api';
import { AuthService } from './auth';
import { IN_PROGRESS, MASTERED, statusOf } from './levels';
import {
  AnswerResponse,
  Concept,
  ContactInput,
  Heatmap,
  MasteryResponse,
  PathStep,
  ProfileUpdate,
  QuestionInput,
  QuizResponse,
  TeacherQuestion,
  User,
} from './models';
import {
  EMAIL_PATTERN,
  FieldErrors,
  hasErrors,
  validateContact,
  validateProfile,
  validateQuestion,
} from './validation';

interface MasteryRow {
  userId: string;
  conceptId: string;
  level: number;
}
interface Message extends ContactInput {
  id: string;
  userId: string | null;
  createdAt: string;
}
// Tout ce que le visiteur peut modifier, sauvegardé dans le localStorage.
interface DemoState {
  users: User[];
  mastery: MasteryRow[];
  questions: TeacherQuestion[];
  messages: Message[];
}

const STORAGE_KEY = 'fhemt.demo';
const CORRECT_DELTA = 20;
const WRONG_DELTA = -10;
const LATENCY = 150; // ms, pour que les états de chargement restent visibles comme avec une vraie API

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

@Injectable({ providedIn: 'root' })
export class DemoApi implements ApiContract {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  // Les concepts du cours : chargés une fois depuis le fichier JSON statique, puis mis en cache.
  private readonly concepts$ = this.http.get<Concept[]>('demo/concepts.json').pipe(shareReplay(1));

  // L'état modifiable : depuis le localStorage, ou depuis les fichiers seed la première fois.
  // Une collection absente (sauvegarde faite par une version plus ancienne du site) est
  // complétée depuis son fichier seed. defer + shareReplay : un seul chargement, partagé.
  private state: DemoState | null = null;
  private readonly state$: Observable<DemoState> = defer(() => {
    const stored = readStored();
    const pick = <K extends keyof DemoState>(key: K) =>
      stored?.[key] ? of(stored[key]) : this.http.get<DemoState[K]>(`demo/${key}.json`);
    return forkJoin({
      users: pick('users'),
      mastery: pick('mastery'),
      questions: pick('questions'),
      messages: pick('messages'),
    });
  }).pipe(
    map((state) => (this.state = state)),
    shareReplay(1),
  );

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* navigation privée : les changements ne vivent que dans cet onglet */
    }
  }

  // Même forme qu'une erreur HttpClient : errorMessage() et fieldErrors() fonctionnent tels quels.
  private fail(status: number, error: string, fields?: FieldErrors) {
    return throwError(() => ({ status, error: { error, fields } }));
  }
  private invalid(fields: FieldErrors) {
    return this.fail(400, 'Le formulaire contient des erreurs : corrige les champs indiqués.', fields);
  }

  // Les mêmes vérifications que requireUser / requireRole côté serveur.
  private me(): User | null {
    return this.auth.user();
  }
  private isTeacher(user: User) {
    return user.role === 'teacher' || user.role === 'admin';
  }

  private levelsOf(state: DemoState, userId: string): Record<string, number> {
    const levels: Record<string, number> = {};
    for (const m of state.mastery) if (m.userId === userId) levels[m.conceptId] = m.level;
    return levels;
  }

  // ---- les mêmes routes que le backend ------------------------------------

  login(email: string, name: string): Observable<{ user: User }> {
    email = email.trim();
    name = name.trim();
    if (!EMAIL_PATTERN.test(email)) return this.fail(400, 'Saisis une adresse e-mail valide.');
    return this.state$.pipe(
      delay(LATENCY),
      switchMap((state) => {
        let user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          if (name.length < 2) return this.fail(400, 'Saisis ton nom (2 caractères minimum).');
          user = { id: newId('u'), email: email.toLowerCase(), name, role: 'student' };
          state.users.push(user);
          this.save();
        }
        return of({ user });
      }),
    );
  }

  mastery(): Observable<MasteryResponse> {
    const me = this.me();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      map(([concepts, state]) => {
        const levels = this.levelsOf(state, me.id);
        const list = concepts.map((c) => ({
          ...c,
          level: levels[c.id] ?? null,
          status: statusOf(levels[c.id]),
        }));
        return {
          concepts: list,
          overall: Math.round(list.reduce((s, c) => s + (c.level ?? 0), 0) / list.length),
          counts: {
            mastered: list.filter((c) => c.status === 'mastered').length,
            inProgress: list.filter((c) => c.status === 'in-progress').length,
            weak: list.filter((c) => c.status === 'weak').length,
            notAssessed: list.filter((c) => c.status === 'not-assessed').length,
          },
          thresholds: { mastered: MASTERED, inProgress: IN_PROGRESS },
        };
      }),
    );
  }

  path(): Observable<{ steps: PathStep[] }> {
    const me = this.me();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      map(([concepts, state]) => ({ steps: buildPath(concepts, this.levelsOf(state, me.id)) })),
    );
  }

  quiz(conceptId: string): Observable<QuizResponse> {
    const me = this.me();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      switchMap(([concepts, state]) => {
        const concept = concepts.find((c) => c.id === conceptId);
        if (!concept) return this.fail(404, 'Concept inconnu.');
        return of({
          concept,
          // ne jamais exposer correctIndex ni l'explication avant la réponse
          questions: state.questions
            .filter((q) => q.conceptId === conceptId)
            .map(({ id, text, choices }) => ({ id, text, choices })),
          level: this.levelsOf(state, me.id)[conceptId] ?? null,
        });
      }),
    );
  }

  answer(questionId: string, choiceIndex: number): Observable<AnswerResponse> {
    const me = this.me();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return this.state$.pipe(
      delay(LATENCY),
      switchMap((state) => {
        const question = state.questions.find((q) => q.id === questionId);
        if (!question) return this.fail(404, 'Question inconnue.');
        if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= question.choices.length) {
          return this.fail(400, "choiceIndex doit être l'indice de l'un des choix.");
        }
        const isCorrect = choiceIndex === question.correctIndex;
        const before = this.levelsOf(state, me.id)[question.conceptId];
        const after = Math.max(0, Math.min(100, (before ?? 0) + (isCorrect ? CORRECT_DELTA : WRONG_DELTA)));
        const row = state.mastery.find((m) => m.userId === me.id && m.conceptId === question.conceptId);
        if (row) row.level = after;
        else state.mastery.push({ userId: me.id, conceptId: question.conceptId, level: after });
        this.save();
        return of({
          isCorrect,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          mastery: { before: before ?? 0, after, status: statusOf(after) },
        });
      }),
    );
  }

  concepts(): Observable<{ concepts: Concept[] }> {
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      map(([concepts, state]) => ({
        concepts: concepts.map((c) => ({
          ...c,
          questionCount: state.questions.filter((q) => q.conceptId === c.id).length,
        })),
      })),
    );
  }

  // PATCH /api/users/me : le nom et les préférences, jamais l'e-mail ni le rôle.
  updateProfile(changes: ProfileUpdate): Observable<{ user: User }> {
    const me = this.me();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    const { value, errors } = validateProfile(changes);
    if (hasErrors(errors)) return this.invalid(errors);
    if (value.name === undefined && value.preferences === undefined) {
      return this.fail(400, 'Rien à modifier : envoie un nom ou des préférences.');
    }
    return this.state$.pipe(
      delay(LATENCY),
      switchMap((state) => {
        const user = state.users.find((u) => u.id === me.id);
        if (!user) return this.fail(401, "Connecte-toi d'abord.");
        if (value.name !== undefined) user.name = value.name;
        if (value.preferences !== undefined) {
          user.preferences = {
            uiMode: 'classique',
            reduceMotion: false,
            ...user.preferences,
            ...value.preferences,
          };
        }
        this.save();
        return of({ user: { ...user } });
      }),
    );
  }

  // POST /api/contact : ouvert à tous, même sans compte.
  sendContact(message: ContactInput): Observable<{ ok: boolean; id: string }> {
    const { value, errors } = validateContact(message);
    if (hasErrors(errors)) return this.invalid(errors);
    return this.state$.pipe(
      delay(LATENCY),
      map((state) => {
        const saved: Message = {
          ...value,
          id: newId('m'),
          userId: this.me()?.id ?? null,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(saved);
        this.save();
        return { ok: true, id: saved.id };
      }),
    );
  }

  heatmap(): Observable<Heatmap> {
    const me = this.me();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    if (!this.isTeacher(me)) return this.fail(403, 'Cette page est réservée aux comptes enseignant ou administrateur.');
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      map(([concepts, state]) => {
        const students = state.users
          .filter((u) => u.role === 'student')
          .map((s) => ({ id: s.id, name: s.name, levels: this.levelsOf(state, s.id) }));
        const averages: Record<string, number | null> = {};
        for (const c of concepts) {
          const assessed = students.map((s) => s.levels[c.id]).filter((l) => l !== undefined);
          averages[c.id] = assessed.length ? Math.round(assessed.reduce((a, b) => a + b, 0) / assessed.length) : null;
        }
        const candidates = concepts.filter((c) => averages[c.id] !== null);
        const blocking = candidates.length
          ? candidates.reduce((w, c) => ((averages[c.id] as number) < (averages[w.id] as number) ? c : w), candidates[0])
          : null;
        return {
          concepts: concepts.map(({ id, title, short }) => ({ id, title, short })),
          students,
          averages,
          blockingConcept: blocking ? { id: blocking.id, title: blocking.title, average: averages[blocking.id] as number } : null,
        };
      }),
    );
  }

  // GET /api/teacher/questions?conceptId=… (avec les réponses : réservé aux enseignants)
  teacherQuestions(conceptId: string): Observable<{ questions: TeacherQuestion[] }> {
    const denied = this.teacherOnly();
    if (denied) return denied;
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      switchMap(([concepts, state]) => {
        if (!concepts.some((c) => c.id === conceptId)) return this.fail(404, 'Concept inconnu.');
        return of({ questions: state.questions.filter((q) => q.conceptId === conceptId) });
      }),
    );
  }

  createQuestion(input: QuestionInput): Observable<{ question: TeacherQuestion }> {
    const denied = this.teacherOnly();
    if (denied) return denied;
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      switchMap(([concepts, state]) => {
        const { value, errors } = validateQuestion(input, concepts.map((c) => c.id));
        if (hasErrors(errors)) return this.invalid(errors);
        const question: TeacherQuestion = {
          id: newId(`q-${value.conceptId}`),
          ...value,
          createdBy: this.me()?.id,
        };
        state.questions.push(question);
        this.save();
        return of({ question });
      }),
    );
  }

  updateQuestion(id: string, input: QuestionInput): Observable<{ question: TeacherQuestion }> {
    const denied = this.teacherOnly();
    if (denied) return denied;
    return forkJoin([this.concepts$, this.state$]).pipe(
      delay(LATENCY),
      switchMap(([concepts, state]) => {
        const question = state.questions.find((q) => q.id === id);
        if (!question) return this.fail(404, 'Question inconnue.');
        const { value, errors } = validateQuestion(input, concepts.map((c) => c.id));
        if (hasErrors(errors)) return this.invalid(errors);
        Object.assign(question, value, { updatedAt: new Date().toISOString() });
        this.save();
        return of({ question: { ...question } });
      }),
    );
  }

  // requireUser + requireRole('teacher', 'admin') : renvoie une erreur, ou null si c'est permis.
  private teacherOnly(): Observable<never> | null {
    const me = this.me();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    if (!this.isTeacher(me)) return this.fail(403, 'Cette page est réservée aux comptes enseignant ou administrateur.');
    return null;
  }
}

// Même règle que backend/src/services/path.js (voir les explications là-bas).
function buildPath(concepts: Concept[], levels: Record<string, number>): PathStep[] {
  const steps: PathStep[] = [];
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const already = new Set<string>();
  const isMastered = (id: string) => levels[id] !== undefined && levels[id] >= MASTERED;
  const blockedBy = (id: string) =>
    concepts.filter((c) => c.prerequisites.includes(id) && levels[c.id] !== undefined && !isMastered(c.id));

  const push = (concept: Concept, reason: string, kind: PathStep['kind']) => {
    if (already.has(concept.id) || steps.length >= 3) return;
    already.add(concept.id);
    steps.push({ conceptId: concept.id, title: concept.title, level: levels[concept.id] ?? null, reason, kind });
  };

  const reasonFor = (concept: Concept): { reason: string; kind: PathStep['kind'] } => {
    const level = levels[concept.id];
    const blocked = blockedBy(concept.id);
    if (blocked.length) {
      const list = blocked.map((b) => `« ${b.title} » (${levels[b.id]} %)`).join(' et ');
      const where = level === undefined ? 'tu ne l’as pas encore évalué' : `ton niveau y est de ${level} %`;
      return { kind: 'prerequisite', reason: `« ${concept.title} » est un prérequis pour ${list} et ${where}. Consolide-le d'abord.` };
    }
    if (level === undefined) {
      return { kind: 'diagnostic', reason: `Pas encore d'évaluation sur « ${concept.title} » : fais le court quiz de diagnostic.` };
    }
    return { kind: 'practice', reason: `Ton niveau sur « ${concept.title} » est de ${level} %. Entraîne-toi jusqu'à ${MASTERED} %.` };
  };

  for (const concept of concepts) {
    if (steps.length >= 3) break;
    if (isMastered(concept.id)) continue;
    for (const preId of concept.prerequisites) {
      const pre = byId.get(preId);
      if (pre && !isMastered(preId)) {
        const r = reasonFor(pre);
        push(pre, r.reason, r.kind);
      }
    }
    const r = reasonFor(concept);
    push(concept, r.reason, r.kind);
  }
  return steps;
}

function readStored(): Partial<DemoState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<DemoState>) : null;
  } catch {
    return null;
  }
}
