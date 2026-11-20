import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { labelOf, statusOf } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { ErrorState } from '../../shared/error-state/error-state';
import { MasteryLegend } from '../../shared/mastery-legend/mastery-legend';
import { PageHeader } from '../../shared/page-header/page-header';
import { Skeleton } from '../../shared/skeleton/skeleton';

// Espace enseignant : la carte de chaleur de la classe (une ligne par étudiant, une colonne
// par concept) et le concept où la classe bloque. Réservé aux rôles teacher et admin.
@Component({
  selector: 'app-teacher',
  imports: [RouterLink, EmptyState, ErrorState, MasteryLegend, PageHeader, Skeleton],
  templateUrl: './teacher.html',
})
export class Teacher {
  private readonly api = inject(ApiService);
  readonly ui = inject(UiModeService);

  readonly heatmap = rxResource({ stream: () => this.api.heatmap() });

  // La couleur d'une cellule vient de son statut (attribut data-status, voir styles.css).
  readonly statusOf = statusOf;
  readonly errorMessage = errorMessage;

  // Ce que lit un lecteur d'écran pour une cellule : « Amira, Nyquist : 70 %, maîtrisé ».
  cellLabel(student: string, concept: string, level: number | undefined): string {
    if (level === undefined) return `${student}, ${concept} : non évalué`;
    return `${student}, ${concept} : ${level} %, ${labelOf(statusOf(level)).toLowerCase()}`;
  }
}
