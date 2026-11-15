import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth';
import { Heatmap } from '../../core/models';
import { colorOf, statusOf } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';

@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.html',
})
export class Teacher implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly ui = inject(UiModeService);

  readonly data = signal<Heatmap | null>(null);
  readonly error = signal('');
  readonly colorOf = colorOf;
  readonly statusOf = statusOf; // utilisé par la version fiche (couleurs des surligneurs)

  ngOnInit() {
    this.api.heatmap().subscribe({
      next: (data) => this.data.set(data),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  // Couleur du texte lisible sur le fond de la cellule.
  textOn(level: number | undefined): string {
    return level === undefined ? '#6b7280' : '#fff';
  }
}
