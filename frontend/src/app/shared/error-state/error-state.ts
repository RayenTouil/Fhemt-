import { Component, input, output } from '@angular/core';

// État d'erreur : le message et un bouton « Réessayer » qui relance le chargement.
// role="alert" : un lecteur d'écran lit le message dès qu'il apparaît.
//
// Exemple : <app-error-state [message]="…" (retry)="donnees.reload()" />
// (retry) est une sortie (output) : le composant prévient la page, qui sait quoi recharger.
@Component({
  selector: 'app-error-state',
  template: `
    <div class="alert alert--error state--error" role="alert">
      <p>
        <strong>{{ heading() }}</strong>
        {{ message() }}
      </p>
      <div class="state__actions">
        @if (canRetry()) {
          <button type="button" class="btn btn--small" (click)="retry.emit()">Réessayer</button>
        }
        <ng-content />
      </div>
    </div>
  `,
})
export class ErrorState {
  readonly heading = input('Le chargement a échoué.');
  readonly message = input.required<string>();
  readonly canRetry = input(true);
  readonly retry = output<void>();
}
