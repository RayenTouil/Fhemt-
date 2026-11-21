import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth';

// Page 404 : affichée pour toute adresse qui ne correspond à aucune route (path: '**').
// Sur fhemt.me, GitHub Pages renvoie 404.html (une copie d'index.html) pour ces adresses :
// Angular démarre alors et affiche cette page.
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="card state state--404" aria-labelledby="nf-title">
      <p class="state__code" aria-hidden="true">404</p>
      <p class="eyebrow">Page introuvable</p>
      <h1 id="nf-title">Cette page n'existe pas (ou plus)</h1>
      <p class="muted">
        L'adresse <code>{{ url }}</code> ne correspond à aucune page de Fhemt ?. Il y a peut-être
        une faute de frappe, ou le lien a changé.
      </p>
      <div class="state__actions">
        <a class="btn btn--primary" routerLink="/">Retour à l'accueil</a>
        @if (auth.isLoggedIn()) {
          <a class="btn btn--ghost" [routerLink]="auth.isTeacher() ? '/teacher' : '/dashboard'"
            >Mon espace</a
          >
        }
        <a class="btn btn--ghost" routerLink="/contact">Signaler un lien cassé</a>
      </div>
    </section>
  `,
})
export class NotFound {
  readonly auth = inject(AuthService);
  readonly url = inject(Router).url;
}
