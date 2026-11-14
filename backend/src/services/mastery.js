// La règle de maîtrise du MVP. Volontairement simple et facile à expliquer :
//   bonne réponse    -> +20 points
//   mauvaise réponse -> -10 points
//   le niveau reste toujours entre 0 et 100
// Un concept est « maîtrisé » à partir de 70 et « en cours » à partir de 30.
export const CORRECT_DELTA = 20;
export const WRONG_DELTA = -10;
export const MASTERED = 70;
export const IN_PROGRESS = 30;

export function nextLevel(current, isCorrect) {
  const delta = isCorrect ? CORRECT_DELTA : WRONG_DELTA;
  return Math.max(0, Math.min(100, (current ?? 0) + delta));
}

export function statusOf(level) {
  if (level === undefined || level === null) return 'not-assessed';
  if (level >= MASTERED) return 'mastered';
  if (level >= IN_PROGRESS) return 'in-progress';
  return 'weak';
}
