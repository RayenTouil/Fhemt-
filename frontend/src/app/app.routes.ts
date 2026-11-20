import { Routes } from '@angular/router';
import { authGuard, teacherGuard } from './core/guards';

// Le plan du site (sitemap). Chaque route = une page du dossier pages/.
//
// LAZY LOADING : `loadComponent` ne charge le code d'une page qu'au moment où on l'ouvre
// (import() dynamique). Au premier affichage, le navigateur ne télécharge donc que la coquille
// de l'application et la page demandée, au lieu des 12 pages d'un coup.
//
// Guards : authGuard = il faut être connecté ; teacherGuard = enseignant ou admin.
// `title` devient le titre de l'onglet du navigateur (et ce que lit un lecteur d'écran).
export const routes: Routes = [
  // Pages publiques
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'Fhemt ? · Sache ce que tu maîtrises',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
    title: 'À propos · Fhemt ?',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Connexion · Fhemt ?',
  },

  // Espace étudiant (connexion obligatoire)
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
    title: 'Ma maîtrise · Fhemt ?',
  },
  {
    path: 'path',
    loadComponent: () => import('./pages/path/path').then((m) => m.PathPage),
    canActivate: [authGuard],
    title: 'Mon parcours · Fhemt ?',
  },
  {
    path: 'concepts',
    loadComponent: () => import('./pages/concept-map/concept-map').then((m) => m.ConceptMap),
    canActivate: [authGuard],
    title: 'Carte des concepts · Fhemt ?',
  },
  {
    path: 'quiz/:conceptId',
    loadComponent: () => import('./pages/quiz/quiz').then((m) => m.Quiz),
    canActivate: [authGuard],
    title: 'Quiz · Fhemt ?',
  },

  // Espace enseignant (rôle teacher ou admin)
  {
    path: 'teacher',
    loadComponent: () => import('./pages/teacher/teacher').then((m) => m.Teacher),
    canActivate: [authGuard, teacherGuard],
    title: 'Ma classe · Fhemt ?',
  },

  // Toute autre adresse : la page 404 (au lieu de renvoyer à l'accueil sans rien dire).
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
    title: 'Page introuvable · Fhemt ?',
  },
];
