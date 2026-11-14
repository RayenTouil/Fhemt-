// MODE DÉMO : un remplaçant du backend Express qui tourne entièrement dans le navigateur.
//
// Pourquoi ? https://fhemt.me est servi par GitHub Pages, qui n'héberge que des fichiers
// statiques. Cette classe offre exactement les mêmes méthodes qu'ApiService (api.ts),
// lit les mêmes fichiers seed (public/demo/*.json, copiés depuis backend/data/seed) et
// applique les mêmes règles que backend/src/services/*.js. La progression est gardée dans
// le localStorage : chaque visiteur a son propre bac à sable.
//
// app.config.ts choisit cette classe à la place d'ApiService quand environment.apiUrl est vide.
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { delay, map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthService } from './auth';
import { IN_PROGRESS, MASTERED, statusOf } from './levels';
import { AnswerResponse, Heatmap, MasteryResponse, PathStep, QuizResponse, User } from './models';

interface Concept { id: string; title: string; short: string; summary: string; prerequisites: string[] }
interface Question { id: string; conceptId: string; text: string; choices: string[]; correctIndex: number; explanation: string }
interface MasteryRow { userId: string; conceptId: string; level: number }
interface DemoState { users: User[]; mastery: MasteryRow[] }

const STORAGE_KEY = 'fhemt.demo';
const CORRECT_DELTA = 20;
const WRONG_DELTA = -10;
const LATENCY = 150; // ms, pour que les états de chargement restent visibles comme avec une vraie API

@Injectable({ providedIn: 'root' })
export class DemoApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  // Contenu du cours : chargé une fois depuis les fichiers JSON statiques, puis mis en cache.
  private readonly content$ = forkJoin({
    concepts: this.http.get<Concept[]>('demo/concepts.json'),
    questions: this.http.get<Question[]>('demo/questions.json'),
  }).pipe(shareReplay(1));

  // Utilisateurs et maîtrise : depuis le localStorage, ou depuis les fichiers seed la première fois.
  private state: DemoState | null = null;
  private readonly state$ = (): Observable<DemoState> => {
    if (this.state) return of(this.state);
    const stored = readStored();
    if (stored) return of((this.state = stored));
    return forkJoin({
      users: this.http.get<User[]>('demo/users.json'),
      mastery: this.http.get<MasteryRow[]>('demo/mastery.json'),
    }).pipe(map((s) => (this.state = s)));
  };

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* navigation privée : la progression ne vit que dans cet onglet */
    }
  }

  // Même forme qu'une erreur HttpClient : errorMessage() dans api.ts fonctionne tel quel.
  private fail(status: number, error: string) {
    return throwError(() => ({ status, error: { error } }));
  }

  private currentUser(): User | null {
    return this.auth.user();
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
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return this.fail(400, 'Saisis une adresse e-mail valide.');
    return this.state$().pipe(
      delay(LATENCY),
      switchMap((state) => {
        let user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          if (name.length < 2) return this.fail(400, 'Saisis ton nom (2 caractères minimum).');
          user = { id: 'u' + Date.now().toString(36), email: email.toLowerCase(), name, role: 'student' };
          state.users.push(user);
          this.save();
        }
        return of({ user });
      }),
    );
  }

  mastery(): Observable<MasteryResponse> {
    const me = this.currentUser();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return forkJoin([this.content$, this.state$()]).pipe(
      delay(LATENCY),
      map(([{ concepts }, state]) => {
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
    const me = this.currentUser();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return forkJoin([this.content$, this.state$()]).pipe(
      delay(LATENCY),
      map(([{ concepts }, state]) => ({ steps: buildPath(concepts, this.levelsOf(state, me.id)) })),
    );
  }

  quiz(conceptId: string): Observable<QuizResponse> {
    const me = this.currentUser();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return forkJoin([this.content$, this.state$()]).pipe(
      delay(LATENCY),
      switchMap(([{ concepts, questions }, state]) => {
        const concept = concepts.find((c) => c.id === conceptId);
        if (!concept) return this.fail(404, 'Concept inconnu.');
        return of({
          concept,
          // ne jamais exposer correctIndex ni l'explication avant la réponse
          questions: questions.filter((q) => q.conceptId === conceptId).map(({ id, text, choices }) => ({ id, text, choices })),
          level: this.levelsOf(state, me.id)[conceptId] ?? null,
        });
      }),
    );
  }

  answer(questionId: string, choiceIndex: number): Observable<AnswerResponse> {
    const me = this.currentUser();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    return forkJoin([this.content$, this.state$()]).pipe(
      delay(LATENCY),
      switchMap(([{ questions }, state]) => {
        const question = questions.find((q) => q.id === questionId);
        if (!question) return this.fail(404, 'Question inconnue.');
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

  heatmap(): Observable<Heatmap> {
    const me = this.currentUser();
    if (!me) return this.fail(401, "Connecte-toi d'abord.");
    if (me.role !== 'teacher' && me.role !== 'admin') return this.fail(403, 'Cette page est réservée aux comptes enseignant ou administrateur.');
    return forkJoin([this.content$, this.state$()]).pipe(
      delay(LATENCY),
      map(([{ concepts }, state]) => {
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

function readStored(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoState) : null;
  } catch {
    return null;
  }
}
