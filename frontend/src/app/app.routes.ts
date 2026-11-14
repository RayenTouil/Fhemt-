import { Routes } from '@angular/router';
import { authGuard, teacherGuard } from './core/guards';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Quiz } from './pages/quiz/quiz';
import { PathPage } from './pages/path/path';
import { ConceptMap } from './pages/concept-map/concept-map';
import { Teacher } from './pages/teacher/teacher';

// Le plan du site (sitemap). Chaque route = un composant de page.
export const routes: Routes = [
  { path: '', component: Home, title: 'Fhemt ? · Sache ce que tu maîtrises' },
  { path: 'login', component: Login, title: 'Connexion · Fhemt ?' },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard], title: 'Ma maîtrise · Fhemt ?' },
  { path: 'path', component: PathPage, canActivate: [authGuard], title: 'Mon parcours · Fhemt ?' },
  { path: 'concepts', component: ConceptMap, canActivate: [authGuard], title: 'Carte des concepts · Fhemt ?' },
  { path: 'quiz/:conceptId', component: Quiz, canActivate: [authGuard], title: 'Quiz · Fhemt ?' },
  { path: 'teacher', component: Teacher, canActivate: [authGuard, teacherGuard], title: 'Ma classe · Fhemt ?' },
  { path: '**', redirectTo: '' },
];
