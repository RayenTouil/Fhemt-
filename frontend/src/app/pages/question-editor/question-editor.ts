import { Component, ElementRef, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage, fieldErrors } from '../../core/api';
import { fieldError } from '../../core/forms';
import { QuestionInput, TeacherQuestion } from '../../core/models';
import { LIMITS } from '../../core/validation';
import { ErrorState } from '../../shared/error-state/error-state';
import { FieldControl, FormField } from '../../shared/form-field/form-field';
import { PageHeader } from '../../shared/page-header/page-header';
import { Skeleton } from '../../shared/skeleton/skeleton';

// La bonne réponse cochée doit être un choix rempli (règle sur tout le formulaire).
const correctChoiceFilled: ValidatorFn = (group) => {
  const index = group.get('correctIndex')?.value as number | null;
  const choices = group.get('choices')?.value as string[];
  if (index === null || index === undefined) return null; // l'erreur « obligatoire » s'en charge
  return choices?.[index]?.trim() ? null : { correctEmpty: true };
};

// Espace enseignant : créer une question de quiz (POST) ou modifier une question existante (PUT)
// pour un concept. Une question enregistrée apparaît tout de suite dans le quiz des étudiants.
@Component({
  selector: 'app-question-editor',
  imports: [ReactiveFormsModule, RouterLink, ErrorState, FieldControl, FormField, PageHeader, Skeleton],
  templateUrl: './question-editor.html',
})
export class QuestionEditor {
  private readonly api = inject(ApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly formHeading = viewChild<ElementRef<HTMLElement>>('formHeading');

  readonly letters = 'ABCD';
  readonly concepts = rxResource({ stream: () => this.api.concepts() });

  // Le concept choisi dans la liste. linkedSignal : vaut le premier concept au chargement,
  // puis garde le choix de l'enseignant même quand la liste est rechargée.
  readonly conceptId = linkedSignal<string[], string>({
    source: () => (this.concepts.hasValue() ? this.concepts.value().concepts : []).map((c) => c.id),
    computation: (ids, previous) =>
      previous && ids.includes(previous.value) ? previous.value : (ids[0] ?? ''),
  });
  readonly conceptTitle = computed(() => {
    const list = this.concepts.hasValue() ? this.concepts.value().concepts : [];
    return list.find((c) => c.id === this.conceptId())?.title ?? '';
  });

  // Les questions du concept choisi, rechargées quand le concept change (params).
  readonly questions = rxResource({
    params: () => this.conceptId() || undefined, // undefined = rien à charger pour l'instant
    stream: ({ params }) => this.api.teacherQuestions(params),
  });

  // La question en cours de modification (null = on crée une nouvelle question).
  readonly editing = signal<TeacherQuestion | null>(null);

  readonly form = this.fb.group(
    {
      text: [
        '',
        [
          Validators.required,
          Validators.minLength(LIMITS.questionText.min),
          Validators.maxLength(LIMITS.questionText.max),
        ],
      ],
      // Quatre cases ; A et B sont obligatoires, C et D facultatives.
      choices: this.fb.array([
        this.fb.control('', [Validators.required, Validators.maxLength(LIMITS.choice.max)]),
        this.fb.control('', [Validators.required, Validators.maxLength(LIMITS.choice.max)]),
        this.fb.control('', [Validators.maxLength(LIMITS.choice.max)]),
        this.fb.control('', [Validators.maxLength(LIMITS.choice.max)]),
      ]),
      correctIndex: this.fb.control<number | null>(null, Validators.required),
      explanation: [
        '',
        [
          Validators.required,
          Validators.minLength(LIMITS.explanation.min),
          Validators.maxLength(LIMITS.explanation.max),
        ],
      ],
    },
    { validators: correctChoiceFilled },
  );

  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly status = signal(''); // annoncé aux lecteurs d'écran après l'enregistrement
  readonly savedConcept = signal(''); // pour le lien « Voir le quiz »
  readonly error = signal('');
  readonly serverErrors = signal<Record<string, string>>({});
  readonly errorMessage = errorMessage;

  errorOf(field: 'text' | 'explanation'): string {
    return this.serverErrors()[field] || fieldError(this.form.controls[field], this.submitted());
  }

  choicesError(): string {
    const server = this.serverErrors()['choices'];
    if (server) return server;
    if (!this.submitted()) return '';
    const [a, b] = this.form.controls.choices.controls;
    if (a.invalid || b.invalid) {
      return a.errors?.['maxlength'] || b.errors?.['maxlength']
        ? `Chaque choix fait ${LIMITS.choice.max} caractères maximum.`
        : 'Remplis au moins les choix A et B.';
    }
    if (this.form.controls.choices.invalid) return `Chaque choix fait ${LIMITS.choice.max} caractères maximum.`;
    return '';
  }

  correctError(): string {
    const server = this.serverErrors()['correctIndex'];
    if (server) return server;
    if (!this.submitted()) return '';
    if (this.form.controls.correctIndex.invalid) return 'Coche la bonne réponse.';
    if (this.form.errors?.['correctEmpty']) return 'La bonne réponse cochée doit être un choix rempli.';
    return '';
  }

  selectConcept(id: string) {
    this.conceptId.set(id);
    this.newQuestion();
    this.status.set('');
  }

  newQuestion() {
    this.editing.set(null);
    this.resetForm();
  }

  edit(question: TeacherQuestion) {
    this.editing.set(question);
    this.resetForm();
    const choices = [...question.choices, '', '', ''].slice(0, 4);
    this.form.setValue({
      text: question.text,
      choices,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    });
    this.formHeading()?.nativeElement.focus(); // le clavier et le lecteur d'écran suivent
  }

  save() {
    this.submitted.set(true);
    this.status.set('');
    this.error.set('');
    this.serverErrors.set({});
    if (this.form.invalid) return;

    // On retire les cases vides (C, D) et on recalcule l'indice de la bonne réponse.
    const v = this.form.getRawValue();
    const filled = v.choices.map((text, index) => ({ text: text.trim(), index })).filter((c) => c.text);
    const editing = this.editing();
    const input: QuestionInput = {
      conceptId: editing?.conceptId ?? this.conceptId(),
      text: v.text,
      choices: filled.map((c) => c.text),
      correctIndex: filled.findIndex((c) => c.index === v.correctIndex),
      explanation: v.explanation,
    };
    const request = editing
      ? this.api.updateQuestion(editing.id, input)
      : this.api.createQuestion(input);

    this.saving.set(true);
    request.subscribe({
      next: ({ question }) => {
        this.saving.set(false);
        this.status.set(
          editing
            ? 'Question modifiée. Les étudiants voient déjà la nouvelle version.'
            : `Question créée : elle apparaît maintenant dans le quiz « ${this.conceptTitle()} ».`,
        );
        this.savedConcept.set(question.conceptId);
        this.newQuestion();
        this.questions.reload();
        this.concepts.reload(); // met à jour le nombre de questions par concept
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
        this.serverErrors.set(fieldErrors(err));
      },
    });
  }

  private resetForm() {
    this.form.reset({ text: '', choices: ['', '', '', ''], correctIndex: null, explanation: '' });
    this.submitted.set(false);
    this.serverErrors.set({});
    this.error.set('');
  }
}
