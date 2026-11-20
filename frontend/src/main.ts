// Point de départ de l'application : Angular démarre le composant racine (App, dans app.ts)
// avec la configuration de app.config.ts (routes, HttpClient, choix entre API et mode démo).
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
