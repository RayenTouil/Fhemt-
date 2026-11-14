import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { AnswerResponse, QuizResponse } from '../../core/models';

@Component({
  selector: 'app-quiz',
  imports: [RouterLink],
  templateUrl: './quiz.html',
})
export class Quiz {
  private readonly api = inject(ApiService);

  // Vient de l'URL /quiz/:conceptId (withComponentInputBinding dans app.config.ts)
  readonly conceptId = input.required<string>();

  readonly quiz = signal<QuizResponse | null>(null);
  readonly error = signal('');
  readonly index = signal(0); // la question affichée
  readonly selected = signal<number | null>(null); // le choix cliqué
  readonly result = signal<AnswerResponse | null>(null); // la correction renvoyée par le backend
  readonly correctCount = signal(0);
  readonly startLevel = signal(0);
  readonly currentLevel = signal(0);
  readonly sending = signal(false);

  readonly question = computed(() => this.quiz()?.questions[this.index()] ?? null);
  readonly finished = computed(() => {
    const q = this.quiz();
    return !!q && this.index() >= q.questions.length;
  });

  constructor() {
    // Recharge le quiz chaque fois que le concept dans l'URL change.
    effect(() => {
      const id = this.conceptId();
      untracked(() => this.load(id));
    });
  }

  load(conceptId: string) {
    this.quiz.set(null);
    this.error.set('');
    this.index.set(0);
    this.selected.set(null);
    this.result.set(null);
    this.correctCount.set(0);
    this.api.quiz(conceptId).subscribe({
      next: (quiz) => {
        this.quiz.set(quiz);
        this.startLevel.set(quiz.level ?? 0);
        this.currentLevel.set(quiz.level ?? 0);
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  choose(choiceIndex: number) {
    const q = this.question();
    if (!q || this.result() || this.sending()) return; // déjà répondu
    this.selected.set(choiceIndex);
    this.sending.set(true);
    this.api.answer(q.id, choiceIndex).subscribe({
      next: (res) => {
        this.result.set(res);
        this.currentLevel.set(res.mastery.after);
        if (res.isCorrect) this.correctCount.update((n) => n + 1);
        this.sending.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
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
    this.load(this.conceptId());
  }
}
