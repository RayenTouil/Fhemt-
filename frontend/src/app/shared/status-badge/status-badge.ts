import { Component, computed, input } from '@angular/core';
import { kindLabel, labelOf } from '../../core/levels';
import { MasteryStatus, PathStep } from '../../core/models';

// Pastille de statut. Deux usages :
//  - le niveau de maîtrise d'un concept : <app-status-badge status="mastered" />  → « Maîtrisé »
//  - le type d'une étape du parcours :    <app-status-badge kind="diagnostic" />  → « Diagnostic »
// La couleur vient des classes CSS is-… et kind-… (styles.css et ui-fiche.css).
@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="cssClass()">{{ text() }}</span>`,
})
export class StatusBadge {
  readonly status = input<MasteryStatus>('not-assessed');
  readonly kind = input<PathStep['kind'] | null>(null);

  readonly cssClass = computed(() => {
    const kind = this.kind();
    return kind ? 'kind-' + kind : 'is-' + this.status();
  });
  readonly text = computed(() => {
    const kind = this.kind();
    return kind ? kindLabel(kind) : labelOf(this.status());
  });
}
