import { Injectable, computed, signal } from '@angular/core';
import { User } from './models';

const STORAGE_KEY = 'fhemt.user';

// Garde « qui est connecté » pour toute l'application.
// Un signal est une valeur qui prévient les templates quand elle change.
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(readStoredUser());
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isTeacher = computed(() => {
    const role = this.user()?.role;
    return role === 'teacher' || role === 'admin';
  });

  setUser(user: User) {
    this.user.set(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); // survit à un rechargement de la page
    } catch {
      /* navigation privée : la session ne sera simplement pas conservée */
    }
  }

  logout() {
    this.user.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* rien à faire */
    }
  }
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
