import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

// Les guards décident si une route peut s'ouvrir. Ils reproduisent les vérifications du backend :
// le backend reste la vraie autorité, le guard améliore seulement l'expérience.

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

export const teacherGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isTeacher() ? true : router.createUrlTree(['/dashboard']);
};
