// La configuration de l'application, lue au démarrage (main.ts) : le routeur et ses options,
// HttpClient et son intercepteur, et le choix entre la vraie API et le mode démo.
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { ApiService, DEMO_MODE, authInterceptor } from './core/api';
import { DemoApi } from './core/demo-api';
import { DelayedPreloading } from './core/preloading';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Un paramètre de route (:conceptId) arrive comme input du composant.
      withComponentInputBinding(),
      // Navigation fluide : on revient en haut de la nouvelle page (ou à la position d'avant
      // avec le bouton Retour), et les liens vers une ancre (#comment) font défiler jusqu'à elle.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Transition douce entre deux pages (API View Transitions du navigateur, voir styles.css).
      withViewTransitions({ skipInitialTransition: true }),
      // 2 secondes après l'arrivée, le code des autres pages est téléchargé en arrière-plan :
      // les clics suivants sont instantanés (voir core/preloading.ts).
      withPreloading(DelayedPreloading),
    ),
    // HttpClient + notre intercepteur qui ajoute l'en-tête x-user-id.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // Injection de dépendances : les pages demandent ApiService ; en mode démo (pas d'URL
    // de backend, par exemple sur GitHub Pages) Angular leur donne DemoApi à la place.
    { provide: ApiService, useClass: DEMO_MODE ? DemoApi : ApiService },
  ],
};
