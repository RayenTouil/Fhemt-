import { Component, input } from '@angular/core';

// En-tête commun à toutes les pages : une petite étiquette (eyebrow), le titre h1 et un sous-titre.
// Ce qu'on écrit ENTRE les balises <app-page-header>…</app-page-header> s'affiche à droite du
// titre (par exemple le niveau dans le quiz) : c'est la « projection de contenu » (<ng-content />).
//
// Exemple : <app-page-header eyebrow="Parcours" heading="Quoi faire ensuite" subtitle="…" />
@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-head">
      <div class="page-head__text">
        @if (eyebrow()) {
          <p class="eyebrow">{{ eyebrow() }}</p>
        }
        <h1>{{ heading() }}</h1>
        @if (subtitle()) {
          <p class="muted">{{ subtitle() }}</p>
        }
      </div>
      <ng-content />
    </header>
  `,
})
export class PageHeader {
  readonly eyebrow = input('');
  // « heading » et pas « title » : un attribut title sur la balise afficherait une infobulle.
  readonly heading = input.required<string>();
  readonly subtitle = input('');
}
