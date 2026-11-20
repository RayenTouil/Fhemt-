import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { DEMO_MODE } from './core/api';

// La coquille de l'application : la barre de navigation en haut, la page courante au milieu
// (<router-outlet> : le routeur y affiche la page de l'URL) et le pied de page en bas.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <app-navbar />
    @if (demo) {
      <div class="demo-banner" role="note">
        <strong>Mode démo</strong> · ce site public n'a pas de serveur derrière lui : les données et
        les règles s'exécutent dans ton navigateur et ta progression reste sur cet appareil. La
        version complète, avec l'API Express, se lance en local (voir le README).
      </div>
    }
    <main id="contenu" class="page" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class App {
  readonly demo = DEMO_MODE;
}
