import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, pairwise } from 'rxjs/operators';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { DEMO_MODE } from './core/api';

// La coquille de l'application : la barre de navigation en haut, la page courante au milieu
// (<router-outlet> : le routeur y affiche la page de l'URL) et le pied de page en bas.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <!-- Lien d'évitement : la première touche Tab le fait apparaître ; Entrée saute la navigation -->
    <a class="skip-link" href="#contenu" (click)="skipToContent($event)">Aller au contenu</a>
    <app-navbar />
    @if (demo) {
      <aside class="demo-banner" aria-label="Mode démo">
        <strong>Mode démo</strong> · ce site public n'a pas de serveur derrière lui : les données et
        les règles s'exécutent dans ton navigateur et ta progression reste sur cet appareil. La
        version complète, avec l'API Express, se lance en local (voir le README).
      </aside>
    }
    <main #main id="contenu" class="page" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class App {
  readonly demo = DEMO_MODE;
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    // Après un changement de page, le focus va au début du contenu : un lecteur d'écran
    // annonce la nouvelle page et la touche Tab repart de là (et non du lien cliqué, qui a disparu).
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects.split('#')[0]),
        pairwise(), // [page précédente, nouvelle page] : rien au premier affichage
        filter(([before, after]) => before !== after),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.main().nativeElement.focus({ preventScroll: true }));
  }

  // Avec <base href="/">, un lien « #contenu » ramènerait à l'accueil : on déplace le focus nous-mêmes.
  skipToContent(event: Event) {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
