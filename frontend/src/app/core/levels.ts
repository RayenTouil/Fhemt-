// Petites fonctions partagées par toutes les pages qui parlent de maîtrise :
// statut d'un niveau, libellés en français, texte des boutons d'action.
// Les COULEURS ne sont pas ici : elles sont dans styles.css (classes is-mastered, is-weak…),
// pour que les deux habillages (classique et fiche) puissent les changer.
import { MasteryStatus, PathStep, Role } from './models';

// Mêmes seuils que le backend (backend/src/services/mastery.js).
export const MASTERED = 70;
export const IN_PROGRESS = 30;

export function statusOf(level: number | null | undefined): MasteryStatus {
  if (level === null || level === undefined) return 'not-assessed';
  if (level >= MASTERED) return 'mastered';
  if (level >= IN_PROGRESS) return 'in-progress';
  return 'weak';
}

export function labelOf(status: MasteryStatus): string {
  return {
    mastered: 'Maîtrisé',
    'in-progress': 'En cours',
    weak: 'Faible',
    'not-assessed': 'Non évalué',
  }[status];
}

// Le type d'une étape du parcours, tel qu'on l'affiche dans sa pastille.
export function kindLabel(kind: PathStep['kind']): string {
  return {
    prerequisite: "Prérequis d'abord",
    diagnostic: 'Diagnostic',
    practice: 'Entraînement',
  }[kind];
}

export function roleLabel(role: Role): string {
  return { student: 'étudiant', teacher: 'enseignant', admin: 'admin' }[role];
}

// Le texte du bouton qui ouvre le quiz d'un concept : on ne « s'entraîne » que sur un concept
// déjà évalué ; sinon on commence par le quiz de diagnostic.
export function actionLabel(level: number | null | undefined): string {
  return level === null || level === undefined ? 'Faire le quiz' : 'M’entraîner';
}

// Un niveau écrit pour un humain : « 40 % » ou « non évalué ».
export function levelText(level: number | null | undefined): string {
  return level === null || level === undefined ? 'non évalué' : `${level} %`;
}
