import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth';
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
import { environment } from '../../environments/environment';

// L'adresse où écoute le backend Express (voir backend/src/server.js).
// Vide en production = mode démo (voir demo-api.ts et app.config.ts).
export const API_URL = environment.apiUrl;
export const DEMO_MODE = !environment.apiUrl;

// Intercepteur = du code exécuté sur chaque requête HTTP qui sort d'Angular.
// Il ajoute l'identifiant de l'utilisateur connecté, que le backend lit dans requireUser().
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const user = inject(AuthService).user();
  return next(user ? req.clone({ setHeaders: { 'x-user-id': user.id } }) : req);
};

// Une méthode par route du backend. Les composants appellent ces méthodes au lieu de HttpClient.
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  login(email: string, name: string) {
    return this.http.post<{ user: User }>(`${API_URL}/auth/login`, { email, name });
  }

  mastery() {
    return this.http.get<MasteryResponse>(`${API_URL}/mastery/me`);
  }

  path() {
    return this.http.get<{ steps: PathStep[] }>(`${API_URL}/path/me`);
  }

  quiz(conceptId: string) {
    return this.http.get<QuizResponse>(`${API_URL}/quiz/${conceptId}`);
  }

  answer(questionId: string, choiceIndex: number) {
    return this.http.post<AnswerResponse>(`${API_URL}/quiz/answer`, { questionId, choiceIndex });
  }

  concepts() {
    return this.http.get<{ concepts: Concept[] }>(`${API_URL}/concepts`);
  }

  // ---- mise à jour : le profil de l'utilisateur connecté -------------------
  updateProfile(changes: ProfileUpdate) {
    return this.http.patch<{ user: User }>(`${API_URL}/users/me`, changes);
  }

  // ---- création : un message du formulaire de contact ----------------------
  sendContact(message: ContactInput) {
    return this.http.post<{ ok: boolean; id: string }>(`${API_URL}/contact`, message);
  }

  // ---- espace enseignant ----------------------------------------------------
  heatmap() {
    return this.http.get<Heatmap>(`${API_URL}/teacher/heatmap`);
  }

  teacherQuestions(conceptId: string) {
    return this.http.get<{ questions: TeacherQuestion[] }>(`${API_URL}/teacher/questions`, {
      params: { conceptId },
    });
  }

  createQuestion(question: QuestionInput) {
    return this.http.post<{ question: TeacherQuestion }>(`${API_URL}/teacher/questions`, question);
  }

  updateQuestion(id: string, question: QuestionInput) {
    return this.http.put<{ question: TeacherQuestion }>(
      `${API_URL}/teacher/questions/${encodeURIComponent(id)}`,
      question,
    );
  }
}

// Le « contrat » de l'API : la liste des méthodes publiques d'ApiService avec leurs types.
// DemoApi doit le respecter (implements ApiContract) : si on ajoute une méthode ici et qu'on
// oublie de l'écrire dans DemoApi, la compilation échoue. Le mode démo ne peut pas être oublié.
export type ApiContract = { [K in keyof ApiService]: ApiService[K] };

// La forme d'une erreur renvoyée par le backend (ou par DemoApi) : { error, fields? }.
interface ApiError {
  status?: number;
  error?: { error?: string; fields?: Record<string, string> };
  cause?: unknown;
}

// rxResource emballe parfois l'erreur d'origine dans une Error (propriété `cause`) : on la déballe.
function unwrap(err: unknown): ApiError {
  const e = err as ApiError | undefined;
  return e?.cause && typeof e.cause === 'object' ? (e.cause as ApiError) : (e ?? {});
}

// Transforme une erreur HTTP en phrase affichable dans la page.
export function errorMessage(err: unknown): string {
  const e = unwrap(err);
  if (e.status === 0) {
    return 'Le serveur est injoignable. Lance-le avec « npm run dev » dans le dossier backend.';
  }
  return e.error?.error || 'Une erreur est survenue. Réessaie.';
}

// Les erreurs champ par champ renvoyées par la validation du serveur (400), par exemple
// { email: 'Saisis une adresse e-mail valide.' }. Le formulaire les affiche sous chaque champ.
export function fieldErrors(err: unknown): Record<string, string> {
  return unwrap(err).error?.fields ?? {};
}
