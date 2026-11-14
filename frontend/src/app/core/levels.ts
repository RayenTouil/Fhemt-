// Petites fonctions partagées par le tableau de bord, la carte des concepts et la carte de chaleur.
import { MasteryStatus, Role } from './models';

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
    'mastered': 'Maîtrisé',
    'in-progress': 'En cours',
    'weak': 'Faible',
    'not-assessed': 'Non évalué',
  }[status];
}

export function roleLabel(role: Role): string {
  return { student: 'étudiant', teacher: 'enseignant', admin: 'admin' }[role];
}

// Une couleur par statut : remplissage dans la carte SVG et fond des cellules.
export function colorOf(level: number | null | undefined): string {
  return {
    'mastered': '#2e8b57',
    'in-progress': '#f2a900',
    'weak': '#c8102e',
    'not-assessed': '#c9cdd4',
  }[statusOf(level)];
}
