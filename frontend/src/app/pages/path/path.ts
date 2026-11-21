import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { MASTERED, actionLabel } from '../../core/levels';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { ErrorState } from '../../shared/error-state/error-state';
import { PageHeader } from '../../shared/page-header/page-header';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { StatusBadge } from '../../shared/status-badge/status-badge';

// Parcours personnalisé : au plus trois prochaines étapes, chacune avec sa raison
// (règle dans backend/src/services/path.js, recopiée dans core/demo-api.ts).
@Component({
  selector: 'app-path',
  imports: [RouterLink, EmptyState, ErrorState, PageHeader, Skeleton, StatusBadge],
  templateUrl: './path.html',
})
export class PathPage {
  private readonly api = inject(ApiService);

  readonly path = rxResource({ stream: () => this.api.path() });

  readonly errorMessage = errorMessage;
  readonly actionLabel = actionLabel;
  readonly mastered = MASTERED;
}
