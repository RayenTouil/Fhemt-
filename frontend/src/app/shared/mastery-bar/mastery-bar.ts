import { Component, computed, input } from '@angular/core';
import { labelOf, statusOf } from '../../core/levels';

// Barre de maîtrise (0 à 100 %), colorée selon le statut (maîtrisé, en cours, faible, non évalué).
// Utilisée sur l'accueil (exemple Amira / Youssef) et dans le tableau de bord.
//
// Pour un lecteur d'écran, c'est une jauge (role="meter") : il annonce par exemple
// « Maîtrise : Échantillonnage, 80 %, maîtrisé ». La barre se remplit avec une petite
// animation CSS (voir .bar__fill dans styles.css).
@Component({
  selector: 'app-mastery-bar',
  template: `
    @if (label()) {
      <span class="bar__label">{{ label() }}</span>
    }
    <div
      class="bar__track"
      role="meter"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="level() ?? 0"
      [attr.aria-valuetext]="valueText()"
      [attr.aria-label]="'Maîtrise : ' + (label() || name())"
    >
      <div class="bar__fill" [class]="'is-' + status()" [style.width.%]="level() ?? 0"></div>
    </div>
  `,
  host: { class: 'bar', '[class.bar--labelled]': '!!label()' },
})
export class MasteryBar {
  readonly level = input<number | null>(null);
  // Texte visible à gauche de la barre (facultatif).
  readonly label = input('');
  // Nom lu par le lecteur d'écran quand il n'y a pas de texte visible.
  readonly name = input('');

  readonly status = computed(() => statusOf(this.level()));
  readonly valueText = computed(() => {
    const level = this.level();
    return level === null ? 'non évalué' : `${level} %, ${labelOf(this.status()).toLowerCase()}`;
  });
}
