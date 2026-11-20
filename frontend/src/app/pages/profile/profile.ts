import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, errorMessage, fieldErrors } from '../../core/api';
import { AuthService } from '../../core/auth';
import { fieldError } from '../../core/forms';
import { roleLabel } from '../../core/levels';
import { UiModeService } from '../../core/ui-mode';
import { LIMITS } from '../../core/validation';
import { FieldControl, FormField } from '../../shared/form-field/form-field';
import { PageHeader } from '../../shared/page-header/page-header';

// Page Profil : l'utilisateur connecté MET À JOUR son nom et ses préférences
// (PATCH /api/users/me). Les préférences s'appliquent tout de suite et à chaque connexion.
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, FieldControl, FormField, PageHeader],
  templateUrl: './profile.html',
})
export class Profile {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly ui = inject(UiModeService);

  readonly user = this.auth.user;
  readonly roleLabel = roleLabel;
  readonly initials = computed(() =>
    (this.user()?.name ?? '?')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );

  // Valeurs de départ : le profil enregistré, sinon l'affichage actuel.
  private readonly start = {
    name: this.user()?.name ?? '',
    uiMode: this.user()?.preferences?.uiMode ?? this.ui.mode(),
    reduceMotion: this.user()?.preferences?.reduceMotion ?? this.ui.reduceMotion(),
  };

  readonly form = inject(NonNullableFormBuilder).group({
    name: [
      this.start.name,
      [
        Validators.required,
        Validators.minLength(LIMITS.name.min),
        Validators.maxLength(LIMITS.name.max),
      ],
    ],
    uiMode: [this.start.uiMode as 'classique' | 'fiche'],
    reduceMotion: [this.start.reduceMotion],
  });

  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly status = signal(''); // « Profil enregistré. » (annoncé aux lecteurs d'écran)
  readonly error = signal('');
  readonly serverErrors = signal<Record<string, string>>({});

  nameError(): string {
    return this.serverErrors()['name'] || fieldError(this.form.controls.name, this.submitted());
  }

  save() {
    this.submitted.set(true);
    this.status.set('');
    this.error.set('');
    this.serverErrors.set({});
    if (this.form.invalid) return;
    const { name, uiMode, reduceMotion } = this.form.getRawValue();
    this.saving.set(true);
    this.api.updateProfile({ name, preferences: { uiMode, reduceMotion } }).subscribe({
      next: ({ user }) => {
        this.auth.setUser(user); // le nouveau nom apparaît aussi dans la barre de navigation
        this.ui.applyPreferences(user.preferences);
        this.form.markAsPristine();
        this.saving.set(false);
        this.status.set('Profil enregistré. Tes préférences sont appliquées.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
        this.serverErrors.set(fieldErrors(err));
      },
    });
  }
}
