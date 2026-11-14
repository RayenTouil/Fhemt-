import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { PathStep } from '../../core/models';

@Component({
  selector: 'app-path',
  imports: [RouterLink],
  templateUrl: './path.html',
})
export class PathPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly steps = signal<PathStep[] | null>(null);
  readonly error = signal('');

  readonly kindLabel: Record<PathStep['kind'], string> = {
    prerequisite: "Prérequis d'abord",
    diagnostic: 'Diagnostic',
    practice: 'Entraînement',
  };

  ngOnInit() {
    this.api.path().subscribe({
      next: ({ steps }) => this.steps.set(steps),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
