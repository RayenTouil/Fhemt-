import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth';
import { MasteryResponse, PathStep } from '../../core/models';
import { labelOf } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly ui = inject(UiModeService);

  readonly data = signal<MasteryResponse | null>(null);
  readonly nextStep = signal<PathStep | null>(null);
  readonly error = signal('');
  readonly labelOf = labelOf;

  ngOnInit() {
    this.api.mastery().subscribe({
      next: (data) => this.data.set(data),
      error: (err) => this.error.set(errorMessage(err)),
    });
    this.api.path().subscribe({
      next: ({ steps }) => this.nextStep.set(steps[0] ?? null),
      error: () => this.nextStep.set(null),
    });
  }
}
