import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Préchargement « poli » des pages (utilisé dans app.config.ts).
//
// Avec le lazy loading, le code d'une page n'est téléchargé qu'au clic : la première visite est
// légère, mais chaque clic attend un petit téléchargement. Le préchargement télécharge le code
// des autres pages en arrière-plan pour que les clics suivants soient instantanés.
//
// Pourquoi attendre 2 secondes ? Mesuré avec Lighthouse (mobile) : en préchargeant tout de suite
// (PreloadAllModules), ces téléchargements se mettaient en concurrence avec la première page,
// affichée à 2,7 s au lieu de 0,6 s. Après 2 s, la première page est déjà à l'écran.
export const PRELOAD_DELAY_MS = 2000;

@Injectable({ providedIn: 'root' })
export class DelayedPreloading implements PreloadingStrategy {
  preload(_route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return timer(PRELOAD_DELAY_MS).pipe(switchMap(() => load()));
  }
}
