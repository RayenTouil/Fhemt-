import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { actionLabel, levelText } from '../../core/levels';
import { ConceptMastery } from '../../core/models';
import { UiModeService } from '../../core/ui-mode';
import { ErrorState } from '../../shared/error-state/error-state';
import { MasteryLegend } from '../../shared/mastery-legend/mastery-legend';
import { PageHeader } from '../../shared/page-header/page-header';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { ConceptGraph } from './concept-graph';

// Carte des concepts : le cours dessiné comme un graphe (composant ConceptGraph).
// Une flèche = « à voir avant » ; la couleur d'un cercle = la maîtrise de l'étudiant connecté.
// À droite, le détail du concept sélectionné et le bouton pour faire son quiz.
@Component({
  selector: 'app-concept-map',
  imports: [RouterLink, ConceptGraph, ErrorState, MasteryLegend, PageHeader, Skeleton, StatusBadge],
  templateUrl: './concept-map.html',
})
export class ConceptMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly ui = inject(UiModeService);

  readonly mastery = rxResource({ stream: () => this.api.mastery() });
  readonly concepts = computed<ConceptMastery[]>(() =>
    this.mastery.hasValue() ? this.mastery.value().concepts : [],
  );

  // Cliquer deux fois sur le même concept le désélectionne.
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(
    () => this.concepts().find((c) => c.id === this.selectedId()) ?? null,
  );

  readonly errorMessage = errorMessage;
  readonly actionLabel = actionLabel;
  readonly levelText = levelText;

  toggle(id: string) {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  practise(concept: ConceptMastery) {
    this.router.navigate(['/quiz', concept.id]);
  }

  // Les titres des prérequis d'un concept (au lieu de leurs identifiants techniques).
  prerequisiteTitles(concept: ConceptMastery): string {
    const titles = new Map(this.concepts().map((c) => [c.id, c.title]));
    return concept.prerequisites.map((id) => titles.get(id) ?? id).join(', ');
  }
}
