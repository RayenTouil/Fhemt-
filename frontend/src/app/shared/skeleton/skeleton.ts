import { Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'dashboard' | 'list' | 'path' | 'graph' | 'quiz' | 'table';

// Squelette de chargement (« skeleton ») : des blocs gris qui ont la forme du contenu attendu
// et qui « respirent » pendant le chargement. L'œil voit déjà la mise en page, et rien ne saute
// quand les vraies données arrivent.
// Les blocs sont cachés aux lecteurs d'écran (aria-hidden) ; à la place, ils entendent le texte
// « Chargement… » grâce à role="status".
//
// Exemple : <app-skeleton variant="path" [count]="3" label="Construction de ton parcours…" />
@Component({
  selector: 'app-skeleton',
  template: `
    <div class="skeleton" role="status">
      <span class="visually-hidden">{{ label() }}</span>
      <div aria-hidden="true">
        @switch (variant()) {
          @case ('dashboard') {
            <div class="grid grid--summary">
              @for (i of [1, 2, 3]; track i) {
                <div class="card sk-card">
                  <div class="sk sk--circle"></div>
                  <div class="sk sk--line sk--w60"></div>
                </div>
              }
            </div>
            <div class="card">
              @for (i of rows(); track i) {
                <div class="sk-row">
                  <div class="sk sk--line sk--w40"></div>
                  <div class="sk sk--bar"></div>
                </div>
              }
            </div>
          }
          @case ('path') {
            <div class="sk-list">
              @for (i of rows(); track i) {
                <div class="card sk-step">
                  <div class="sk sk--circle sk--sm"></div>
                  <div class="sk-stack">
                    <div class="sk sk--line sk--w30"></div>
                    <div class="sk sk--line sk--w80"></div>
                  </div>
                </div>
              }
            </div>
          }
          @case ('graph') {
            <div class="map">
              <div class="card"><div class="sk sk--graph"></div></div>
              <div class="card">
                <div class="sk sk--line sk--w40"></div>
                <div class="sk sk--line sk--w80"></div>
                <div class="sk sk--line sk--w60"></div>
              </div>
            </div>
          }
          @case ('quiz') {
            <div class="card quiz">
              <div class="sk sk--line sk--w30"></div>
              <div class="sk sk--line sk--lg sk--w80"></div>
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="sk sk--choice"></div>
              }
            </div>
          }
          @case ('table') {
            <div class="card">
              @for (i of rows(); track i) {
                <div class="sk sk--row"></div>
              }
            </div>
          }
          @default {
            <div class="card">
              @for (i of rows(); track i) {
                <div class="sk sk--line" [class.sk--w60]="$odd"></div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('list');
  // Nombre de lignes (ou d'étapes) à dessiner.
  readonly count = input(4);
  readonly label = input('Chargement…');
  readonly rows = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
