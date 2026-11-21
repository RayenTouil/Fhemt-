import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth';
import { fieldError } from '../../core/forms';
import { UiModeService } from '../../core/ui-mode';
import { EMAIL_PATTERN, LIMITS } from '../../core/validation';
import { FieldControl, FormField } from '../../shared/form-field/form-field';

// Page de connexion du MVP : l'adresse e-mail identifie le compte ; le nom n'est demandé
// que pour créer un nouveau compte (étudiant). Le serveur décide du rôle.
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormField, FieldControl],
  templateUrl: './login.html',
})
export class Login {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ui = inject(UiModeService);

  // Le formulaire réactif : un FormControl par champ, avec ses règles.
  readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    name: ['', [Validators.maxLength(LIMITS.name.max)]],
  });
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly fieldError = fieldError;

  // Comptes de démonstration créés dans backend/data/seed/users.json
  readonly demo = [
    { email: 'amira@fhemt.tn', name: 'Amira', hint: 'étudiante · à l’aise en échantillonnage' },
    { email: 'youssef@fhemt.tn', name: 'Youssef', hint: 'étudiant · prérequis fragiles' },
    {
      email: 'teacher@fhemt.tn',
      name: 'Dr. Sami Ben Salah',
      hint: 'enseignant · carte de chaleur',
    },
  ];

  fill(account: { email: string; name: string }) {
    this.form.setValue({ email: account.email, name: account.name });
  }

  submit() {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) return; // les messages s'affichent sous les champs
    this.loading.set(true);
    const { email, name } = this.form.getRawValue();
    this.api.login(email, name).subscribe({
      next: ({ user }) => {
        this.auth.setUser(user);
        this.ui.applyPreferences(user.preferences); // habillage et animations du profil
        this.router.navigateByUrl(user.role === 'student' ? '/dashboard' : '/teacher');
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
