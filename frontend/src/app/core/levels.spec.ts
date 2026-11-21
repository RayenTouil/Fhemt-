// Tests des petites fonctions de maîtrise partagées par les pages.
import { actionLabel, kindLabel, labelOf, levelText, statusOf } from './levels';
import { errorMessage, fieldErrors } from './api';

describe('levels', () => {
  it('statut : maîtrisé à 70, en cours à 30, faible en dessous, non évalué sans niveau', () => {
    expect(statusOf(70)).toBe('mastered');
    expect(statusOf(30)).toBe('in-progress');
    expect(statusOf(29)).toBe('weak');
    expect(statusOf(null)).toBe('not-assessed');
    expect(labelOf('in-progress')).toBe('En cours');
  });

  it('libellés : quiz de diagnostic tant que le concept n’est pas évalué', () => {
    expect(actionLabel(null)).toBe('Faire le quiz');
    expect(actionLabel(0)).toBe('M’entraîner');
    expect(levelText(null)).toBe('non évalué');
    expect(levelText(40)).toBe('40 %');
    expect(kindLabel('prerequisite')).toBe("Prérequis d'abord");
  });
});

describe('messages d’erreur de l’API', () => {
  it('lit le message et les champs, même emballés par rxResource (cause)', () => {
    const apiError = { status: 400, error: { error: 'Refusé.', fields: { email: 'Invalide.' } } };
    const wrapped = new Error('emballée', { cause: apiError });
    expect(errorMessage(apiError)).toBe('Refusé.');
    expect(errorMessage(wrapped)).toBe('Refusé.');
    expect(fieldErrors(wrapped)).toEqual({ email: 'Invalide.' });
  });

  it('explique quand le serveur est injoignable', () => {
    expect(errorMessage({ status: 0 })).toContain('injoignable');
  });
});
