import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth';
import { AnswerResponse, Heatmap, MasteryResponse, PathStep, QuizResponse, User } from './models';
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

  heatmap() {
    return this.http.get<Heatmap>(`${API_URL}/teacher/heatmap`);
  }
}

// Transforme une erreur HTTP en phrase affichable dans la page.
export function errorMessage(err: unknown): string {
  const e = err as { status?: number; error?: { error?: string } };
  if (e?.status === 0) return 'Le serveur est injoignable. Lance-le avec « npm run dev » dans le dossier backend.';
  return e?.error?.error || 'Une erreur est survenue. Réessaie.';
}
