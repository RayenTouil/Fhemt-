// Les règles de validation des formulaires, écrites UNE fois et utilisées à deux endroits :
//  - par les formulaires (Validators d'Angular) pour prévenir l'utilisateur pendant la saisie ;
//  - par DemoApi (mode démo), qui joue le rôle du serveur et doit refuser les mêmes données.
// Le backend applique exactement les mêmes règles et les mêmes messages
// (backend/src/services/validation.js) : le serveur reste la vraie autorité.

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
