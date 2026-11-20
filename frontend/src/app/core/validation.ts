// Les règles de validation des formulaires, écrites UNE fois et utilisées à deux endroits :
//  - par les formulaires (Validators d'Angular) pour prévenir l'utilisateur pendant la saisie ;
//  - par DemoApi (mode démo), qui joue le rôle du serveur et doit refuser les mêmes données.
// Le backend applique exactement les mêmes règles et les mêmes messages
// (backend/src/services/validation.js) : le serveur reste la vraie autorité.
import { ContactInput, ProfileUpdate, QuestionInput } from './models';

// Une adresse e-mail simple : quelque chose @ quelque chose . quelque chose, sans espace.
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Longueurs minimales et maximales (en caractères) de chaque champ.
export const LIMITS = {
  name: { min: 2, max: 60 },
  message: { min: 10, max: 2000 },
  questionText: { min: 10, max: 300 },
  choice: { min: 1, max: 150 },
  explanation: { min: 10, max: 600 },
} as const;

// Les sujets proposés dans le formulaire de contact.
export const CONTACT_SUBJECTS = [
  'Question sur le cours',
  'Signaler un problème',
  'Suggestion',
  'Autre',
] as const;

export const UI_MODES = ['classique', 'fiche'] as const;

// { champ: 'message d'erreur' } ; un objet vide = tout est valide.
export type FieldErrors = Record<string, string>;

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function checkText(
  errors: FieldErrors,
  field: string,
  value: string,
  limit: { min: number; max: number },
) {
  if (!value) errors[field] = 'Ce champ est obligatoire.';
  else if (value.length < limit.min) errors[field] = `Au moins ${limit.min} caractères.`;
  else if (value.length > limit.max) errors[field] = `${limit.max} caractères maximum.`;
}

export function validateContact(input: Partial<ContactInput>) {
  const value: ContactInput = {
    name: text(input.name),
    email: text(input.email).toLowerCase(),
    subject: text(input.subject),
    message: text(input.message),
  };
  const errors: FieldErrors = {};
  checkText(errors, 'name', value.name, LIMITS.name);
  if (!value.email) errors['email'] = 'Ce champ est obligatoire.';
  else if (!EMAIL_PATTERN.test(value.email)) {
    errors['email'] = 'Saisis une adresse e-mail valide (ex. : toi@supcom.tn).';
  }
  if (!(CONTACT_SUBJECTS as readonly string[]).includes(value.subject)) {
    errors['subject'] = 'Choisis un sujet dans la liste.';
  }
  checkText(errors, 'message', value.message, LIMITS.message);
  return { value, errors };
}

export function validateProfile(input: ProfileUpdate) {
  const value: ProfileUpdate = {};
  const errors: FieldErrors = {};
  if (input.name !== undefined) {
    value.name = text(input.name);
    checkText(errors, 'name', value.name, LIMITS.name);
  }
  if (input.preferences !== undefined) {
    const p = input.preferences ?? {};
    value.preferences = {};
    if (p.uiMode !== undefined) {
      if ((UI_MODES as readonly string[]).includes(p.uiMode)) value.preferences.uiMode = p.uiMode;
      else errors['uiMode'] = 'Choisis l’habillage « classique » ou « fiche ».';
    }
    if (p.reduceMotion !== undefined) {
      if (typeof p.reduceMotion === 'boolean') value.preferences.reduceMotion = p.reduceMotion;
      else errors['reduceMotion'] = 'Valeur attendue : vrai ou faux.';
    }
  }
  return { value, errors };
}

export function validateQuestion(input: Partial<QuestionInput>, conceptIds: string[]) {
  const value: QuestionInput = {
    conceptId: text(input.conceptId),
    text: text(input.text),
    choices: Array.isArray(input.choices) ? input.choices.map(text) : [],
    correctIndex: input.correctIndex as number,
    explanation: text(input.explanation),
  };
  const errors: FieldErrors = {};
  if (!conceptIds.includes(value.conceptId))
    errors['conceptId'] = 'Choisis un concept de la liste.';
  checkText(errors, 'text', value.text, LIMITS.questionText);

  const choices = value.choices;
  if (choices.length < 2 || choices.length > 4) errors['choices'] = 'Il faut entre 2 et 4 choix.';
  else if (choices.some((c) => !c)) errors['choices'] = 'Un des choix est vide.';
  else if (choices.some((c) => c.length > LIMITS.choice.max)) {
    errors['choices'] = `Chaque choix fait ${LIMITS.choice.max} caractères maximum.`;
  } else if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) {
    errors['choices'] = 'Deux choix sont identiques.';
  }

  const i = value.correctIndex;
  if (!Number.isInteger(i) || i < 0 || i >= choices.length) {
    errors['correctIndex'] = 'Indique la bonne réponse parmi les choix.';
  }
  checkText(errors, 'explanation', value.explanation, LIMITS.explanation);
  return { value, errors };
}

export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;
