// Tests du mode démo : DemoApi doit appliquer les mêmes règles que le backend
// (création, mise à jour, droits d'accès), avec les fichiers seed servis par HttpClient.
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './auth';
import { DemoApi } from './demo-api';
import { fieldErrors } from './api';
import { User } from './models';

// Un mini-cours de démonstration (les vrais fichiers sont dans public/demo).
const seeds: Record<string, object> = {
  'demo/concepts.json': [
    { id: 'a', title: 'Concept A', short: 'A', summary: 'Le premier.', prerequisites: [] },
    { id: 'b', title: 'Concept B', short: 'B', summary: 'Le second.', prerequisites: ['a'] },
  ],
  'demo/questions.json': [
    {
      id: 'q1',
      conceptId: 'a',
      text: 'Question A ?',
      choices: ['Oui', 'Non'],
      correctIndex: 0,
      explanation: 'Parce que.',
    },
  ],
  'demo/users.json': [
    { id: 'u-eleve', email: 'eleve@fhemt.tn', name: 'Élève', role: 'student' },
    { id: 'u-prof', email: 'prof@fhemt.tn', name: 'Prof', role: 'teacher' },
  ],
  'demo/mastery.json': [],
  'demo/messages.json': [],
};
const student = (seeds['demo/users.json'] as User[])[0];
const teacher = (seeds['demo/users.json'] as User[])[1];

describe('DemoApi (mode démo)', () => {
  let api: DemoApi;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DemoApi);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  // Lance un appel, répond aux demandes de fichiers seed, puis attend le résultat.
  async function run<T>(call: Observable<T>): Promise<T> {
    const result = firstValueFrom(call);
    for (const [url, body] of Object.entries(seeds)) {
      http.match(url).forEach((req) => req.flush(structuredClone(body)));
    }
    return result;
  }

  it('un enseignant crée une question : elle apparaît dans le quiz, sans la réponse', async () => {
    auth.setUser(teacher);
    const { question } = await run(
      api.createQuestion({
        conceptId: 'a',
        text: 'Une nouvelle question ?',
        choices: ['Vrai', 'Faux', 'Je ne sais pas'],
        correctIndex: 1,
        explanation: 'Voici pourquoi.',
      }),
    );
    expect(question.id).toMatch(/^q-a-/);

    auth.setUser(student);
    const quiz = await run(api.quiz('a'));
    const seen = quiz.questions.find((q) => q.id === question.id);
    expect(seen).toBeTruthy();
    expect((seen as unknown as Record<string, unknown>)['correctIndex']).toBeUndefined();
  });

  it('un enseignant modifie une question existante', async () => {
    auth.setUser(teacher);
    const { question } = await run(
      api.updateQuestion('q1', {
        conceptId: 'a',
        text: 'Question A, version corrigée ?',
        choices: ['Oui', 'Non'],
        correctIndex: 1,
        explanation: 'Nouvelle explication.',
      }),
    );
    expect(question.text).toBe('Question A, version corrigée ?');
    const { questions } = await run(api.teacherQuestions('a'));
    expect(questions[0].correctIndex).toBe(1);
  });

  it('refuse une question invalide avec le détail par champ (400)', async () => {
    auth.setUser(teacher);
    const err = await run(
      api.createQuestion({
        conceptId: 'a',
        text: 'Court',
        choices: ['Oui', ''],
        correctIndex: 4,
        explanation: '',
      }),
    ).catch((e) => e);
    expect(err.status).toBe(400);
    expect(fieldErrors(err)['choices']).toBe('Un des choix est vide.');
    expect(fieldErrors(err)['text']).toBe('Au moins 10 caractères.');
  });

  it('un étudiant ne peut ni voir ni créer les questions avec réponses (403)', async () => {
    auth.setUser(student);
    const err = await run(api.teacherQuestions('a')).catch((e) => e);
    expect(err.status).toBe(403);
  });

  it('met à jour le profil (nom et préférences) sans toucher au rôle', async () => {
    auth.setUser(student);
    const { user } = await run(
      api.updateProfile({
        name: '  Élève modèle ',
        preferences: { uiMode: 'fiche', reduceMotion: true },
      }),
    );
    expect(user.name).toBe('Élève modèle');
    expect(user.role).toBe('student');
    expect(user.preferences).toEqual({ uiMode: 'fiche', reduceMotion: true });
  });

  it('enregistre un message de contact dans le localStorage, même sans compte', async () => {
    const res = await run(
      api.sendContact({
        name: 'Visiteur',
        email: 'v@exemple.tn',
        subject: 'Autre',
        message: 'Bonjour à toute l’équipe !',
      }),
    );
    expect(res.ok).toBe(true);
    const saved = JSON.parse(localStorage.getItem('fhemt.demo') ?? '{}');
    expect(saved.messages[0].email).toBe('v@exemple.tn');
  });

  it('une bonne réponse fait monter la maîtrise de 20 points', async () => {
    auth.setUser(student);
    const res = await run(api.answer('q1', 0));
    expect(res.isCorrect).toBe(true);
    expect(res.mastery).toEqual({ before: 0, after: 20, status: 'weak' });
  });

  afterEach(() => http.verify());
});
