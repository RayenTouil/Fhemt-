import { Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { MASTERED } from '../../core/levels';
import { AnswerResponse } from '../../core/models';
import { UiModeService } from '../../core/ui-mode';
import { ErrorState } from '../../shared/error-state/error-state';
import { PageHeader } from '../../shared/page-header/page-header';
import { Skeleton } from '../../shared/skeleton/skeleton';

// Le quiz d'un concept : une question à la fois, correction immédiate par le serveur
// (POST /api/quiz/answer), puis le bilan avec le nouveau niveau de maîtrise.
@Component({
  selector: 'app-quiz',
  imports: [RouterLink, ErrorState, PageHeader, Skeleton],
  templateUrl: './quiz.html',
})
export class Quiz {
  private readonly api = inject(ApiService);
  readonly ui = inject(UiModeService);

  // Vient de l'URL /quiz/:conceptId (withComponentInputBinding dans app.config.ts)
  readonly conceptId = input.required<string>();

  // `params` : le quiz est rechargé tout seul quand le concept de l'URL change.
  readonly quiz = rxResource({
    params: () => this.conceptId(),
    stream: ({ params }) => this.api.quiz(params),
  });

  readonly index = signal(0); // la question affichée
  readonly selected = signal<number | null>(null); // le choix cliqué
  readonly result = signal<AnswerResponse | null>(null); // la correction renvoyée par le serveur
  readonly correctCount = signal(0);
  readonly sending = signal(false);
  readonly answerError = signal('');

  // Le niveau au début du quiz, puis le niveau après chaque réponse.
  // linkedSignal : repart du niveau chargé à chaque (re)chargement du quiz, mais reste modifiable.
  readonly startLevel = computed(() => (this.quiz.hasValue() ? (this.quiz.value()?.level ?? 0) : 0));
  readonly currentLevel = linkedSignal(() => this.startLevel());

  readonly question = computed(() =>
    this.quiz.hasValue() ? (this.quiz.value()?.questions[this.index()] ?? null) : null,
  );
  readonly finished = computed(() => {
    const q = this.quiz.hasValue() ? this.quiz.value() : undefined;
    return !!q && this.index() >= q.questions.length;
  });

  readonly mastered = MASTERED;
  readonly errorMessage = errorMessage;
  readonly letters = 'ABCD';

  constructor() {
    // Nouveau concept dans l'URL : on repart de la première question.
    effect(() => {
      this.conceptId();
      untracked(() => this.resetProgress());
    });
  }

  private resetProgress() {
    this.index.set(0);
    this.selected.set(null);
    this.result.set(null);
    this.correctCount.set(0);
    this.answerError.set('');
  }

  choose(choiceIndex: number) {
    const q = this.question();
    if (!q || this.result() || this.sending()) return; // déjà répondu
    this.selected.set(choiceIndex);
    this.sending.set(true);
    this.answerError.set('');
    this.api.answer(q.id, choiceIndex).subscribe({
      next: (res) => {
        this.result.set(res);
        this.currentLevel.set(res.mastery.after);
        if (res.isCorrect) this.correctCount.update((n) => n + 1);
        this.sending.set(false);
      },
      error: (err) => {
        this.answerError.set(errorMessage(err));
        this.selected.set(null);
        this.sending.set(false);
      },
    });
  }

  next() {
    this.index.update((i) => i + 1);
    this.selected.set(null);
    this.result.set(null);
  }

  retry() {
    this.resetProgress();
    this.quiz.reload();
  }
}
