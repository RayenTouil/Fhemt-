import { Component, input } from '@angular/core';
import { IN_PROGRESS, MASTERED } from '../../core/levels';

// Légende des quatre couleurs de maîtrise, sous la carte des concepts et la carte de chaleur.
// Les pastilles utilisent les mêmes classes CSS que les barres : si une couleur change dans
// styles.css (ou dans le mode fiche), la légende suit toute seule.
@Component({
  selector: 'app-mastery-legend',
  template: `
    <ul class="legend" aria-label="Légende des couleurs">
      <li><i class="is-mastered" aria-hidden="true"></i> Maîtrisé (≥ {{ mastered }}&nbsp;%)</li>
      <li>
        <i class="is-in-progress" aria-hidden="true"></i> En cours ({{ inProgress }} à
        {{ mastered - 1 }}&nbsp;%)
      </li>
      <li><i class="is-weak" aria-hidden="true"></i> Faible (&lt; {{ inProgress }}&nbsp;%)</li>
      <li>
        <i class="is-not-assessed" aria-hidden="true"></i> Non évalué
        @if (notAssessedNote()) {
          ({{ notAssessedNote() }})
        }
      </li>
    </ul>
  `,
})
export class MasteryLegend {
  // Précision facultative après « Non évalué », par exemple « pas compté dans la moyenne ».
  readonly notAssessedNote = input('');
  readonly mastered = MASTERED;
  readonly inProgress = IN_PROGRESS;
}
