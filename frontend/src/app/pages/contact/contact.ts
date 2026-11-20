import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, DEMO_MODE, errorMessage, fieldErrors } from '../../core/api';
import { AuthService } from '../../core/auth';
import { fieldError } from '../../core/forms';
import { CONTACT_SUBJECTS, EMAIL_PATTERN, LIMITS } from '../../core/validation';
import { FieldControl, FormField } from '../../shared/form-field/form-field';
import { PageHeader } from '../../shared/page-header/page-header';

// Page Contact (publique) : un formulaire qui CRÉE un message (POST /api/contact).
// La validation se fait deux fois : ici pendant la saisie (pour aider), puis sur le serveur
// (pour protéger). Si le serveur refuse un champ, son message s'affiche sous ce champ.
@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RouterLink, FieldControl, FormField, PageHeader],
  templateUrl: './contact.html',
})
export class Contact {
  private readonly api = inject(ApiService);
  private readonly user = inject(AuthService).user();

  readonly subjects = CONTACT_SUBJECTS;
  readonly limits = LIMITS;
  readonly demo = DEMO_MODE;

  // Pré-rempli avec le nom et l'e-mail de la personne connectée.
  readonly form = inject(NonNullableFormBuilder).group({
    name: [
      this.user?.name ?? '',
      [Validators.required, Validators.minLength(LIMITS.name.min), Validators.maxLength(LIMITS.name.max)],
    ],
    email: [this.user?.email ?? '', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    subject: [CONTACT_SUBJECTS[0] as string, [Validators.required]],
    message: [
      '',
      [
        Validators.required,
        Validators.minLength(LIMITS.message.min),
        Validators.maxLength(LIMITS.message.max),
      ],
    ],
  });

  readonly submitted = signal(false);
  readonly sending = signal(false);
  readonly sent = signal(false); // vrai après un envoi réussi : on affiche le remerciement
  readonly error = signal('');
  readonly serverErrors = signal<Record<string, string>>({});

  // Le message d'erreur d'un champ : celui du serveur s'il y en a un, sinon celui du formulaire.
  errorOf(field: 'name' | 'email' | 'subject' | 'message'): string {
    return this.serverErrors()[field] || fieldError(this.form.controls[field], this.submitted());
  }

  submit() {
    this.submitted.set(true);
    this.error.set('');
    this.serverErrors.set({});
    if (this.form.invalid) return;
    this.sending.set(true);
    this.api.sendContact(this.form.getRawValue()).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(errorMessage(err));
        this.serverErrors.set(fieldErrors(err));
      },
    });
  }

  // « Écrire un autre message » : on garde le nom et l'e-mail, on vide le reste.
  writeAnother() {
    this.form.controls.message.reset('');
    this.submitted.set(false);
    this.sent.set(false);
  }
}
