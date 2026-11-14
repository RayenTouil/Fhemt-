import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { ApiService, DEMO_MODE, authInterceptor } from './core/api';
import { DemoApi } from './core/demo-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding : un paramètre de route (:conceptId) arrive comme input du composant.
    provideRouter(routes, withComponentInputBinding()),
    // HttpClient + notre intercepteur qui ajoute l'en-tête x-user-id.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // Injection de dépendances : les pages demandent ApiService ; en mode démo (pas d'URL
    // de backend, par exemple sur GitHub Pages) Angular leur donne DemoApi à la place.
    { provide: ApiService, useClass: DEMO_MODE ? DemoApi : ApiService },
  ],
};
