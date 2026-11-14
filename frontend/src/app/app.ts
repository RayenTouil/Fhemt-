import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { DEMO_MODE } from './core/api';

// La coquille de l'application : la barre de navigation en haut, la page courante en dessous.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  template: `
    <app-navbar />
    @if (demo) {
      <div class="demo-banner" role="note">
        <strong>Mode démo</strong> · ce site public n'a pas de serveur derrière lui : les données et les règles
        s'exécutent dans ton navigateur et ta progression reste sur cet appareil. La version complète, avec
        l'API Express, se lance en local (voir le README).
      </div>
    }
    <main class="page">
      <router-outlet />
    </main>
    <footer class="footer">
      Fhemt ? · Projet web Sup'Com · Objectif 3 (MVP) ·
      <a href="https://github.com/RayenTouil/Fhemt-" target="_blank" rel="noopener">code source sur GitHub</a>
    </footer>
  `,
})
export class App {
  readonly demo = DEMO_MODE;
}
