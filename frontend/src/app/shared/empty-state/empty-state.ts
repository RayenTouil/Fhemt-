import { Component, input } from '@angular/core';

// État vide : quand il n'y a encore rien à afficher, on ne laisse pas un trou blanc.
// On dit pourquoi c'est vide et quoi faire ensuite (le bouton est projeté entre les balises).
//
// Exemple :
//   <app-empty-state heading="Aucun concept évalué" message="Commence par un quiz de diagnostic.">
//     <a class="btn btn--primary" routerLink="/path">Voir mon parcours</a>
//   </app-empty-state>
@Component({
  selector: 'app-empty-state',
  template: `
    <section class="card state state--empty">
      <svg class="state__icon" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="7" width="30" height="36" rx="4" />
        <path d="M16 17h16M16 24h16M16 31h9" />
      </svg>
      <h2>{{ heading() }}</h2>
      @if (message()) {
        <p class="muted">{{ message() }}</p>
      }
      <div class="state__actions"><ng-content /></div>
    </section>
  `,
})
export class EmptyState {
  readonly heading = input.required<string>();
  readonly message = input('');
}
