import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth';
import { actionLabel, levelText } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { ErrorState } from '../../shared/error-state/error-state';
import { MasteryBar } from '../../shared/mastery-bar/mastery-bar';
import { PageHeader } from '../../shared/page-header/page-header';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { StatusBadge } from '../../shared/status-badge/status-badge';

// Tableau de bord de l'étudiant : maîtrise globale, compteurs, prochaine étape et
// la maîtrise de chaque concept.
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, EmptyState, ErrorState, MasteryBar, PageHeader, Skeleton, StatusBadge],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly ui = inject(UiModeService);

  // rxResource charge des données et les range dans des signaux :
  // value() (les données), isLoading(), error() et reload() pour recommencer.
  // C'est l'équivalent Angular d'un « hook » React comme useFetch.
  readonly mastery = rxResource({ stream: () => this.api.mastery() });
  readonly path = rxResource({ stream: () => this.api.path() });

  // La première étape du parcours (ou null si tout est maîtrisé).
  readonly nextStep = computed(() =>
    this.path.hasValue() ? (this.path.value().steps[0] ?? null) : null,
  );

  readonly greeting = computed(() => `Bonjour ${this.auth.user()?.name ?? ''}, voici ta maîtrise`);

  readonly errorMessage = errorMessage;
  readonly actionLabel = actionLabel;
  readonly levelText = levelText;

  reload() {
    this.mastery.reload();
    this.path.reload();
  }
}
