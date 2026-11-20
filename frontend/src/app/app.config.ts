import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
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
      // Une fois la première page affichée, le code des autres pages est téléchargé en
      // arrière-plan : le clic suivant est instantané.
      withPreloading(PreloadAllModules),
    ),
    // HttpClient + notre intercepteur qui ajoute l'en-tête x-user-id.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // Injection de dépendances : les pages demandent ApiService ; en mode démo (pas d'URL
    // de backend, par exemple sur GitHub Pages) Angular leur donne DemoApi à la place.
    { provide: ApiService, useClass: DEMO_MODE ? DemoApi : ApiService },
  ],
};
