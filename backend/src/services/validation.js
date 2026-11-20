// La validation des données envoyées par les formulaires (contact, profil, questions).
//
// Le formulaire du site vérifie déjà la saisie, mais le serveur ne doit JAMAIS lui faire
// confiance : n'importe qui peut envoyer une requête sans passer par le site. Chaque fonction
// renvoie { value, errors } :
//   - value  : les données nettoyées (espaces retirés), prêtes à être enregistrées ;
//   - errors : { champ: 'message' } pour chaque champ refusé ({} si tout va bien).
// Les messages sont les mêmes que dans le frontend (frontend/src/app/core/validation.ts),
// qui applique ces règles en mode démo.

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const LIMITS = {
  name: { min: 2, max: 60 },
  message: { min: 10, max: 2000 },
  questionText: { min: 10, max: 300 },
  choice: { min: 1, max: 150 },
  explanation: { min: 10, max: 600 },
};

export const CONTACT_SUBJECTS = ['Question sur le cours', 'Signaler un problème', 'Suggestion', 'Autre'];
export const UI_MODES = ['classique', 'fiche'];

const text = (v) => (typeof v === 'string' ? v.trim() : '');

// Vérifie qu'un texte est rempli et que sa longueur est dans les limites.
function checkText(errors, field, value, { min, max }) {
  if (!value) errors[field] = 'Ce champ est obligatoire.';
  else if (value.length < min) errors[field] = `Au moins ${min} caractères.`;
  else if (value.length > max) errors[field] = `${max} caractères maximum.`;
}

// POST /api/contact
export function validateContact(body = {}) {
  const value = {
    name: text(body.name),
    email: text(body.email).toLowerCase(),
    subject: text(body.subject),
    message: text(body.message),
  };
  const errors = {};
  checkText(errors, 'name', value.name, LIMITS.name);
  if (!value.email) errors.email = 'Ce champ est obligatoire.';
  else if (!EMAIL_PATTERN.test(value.email)) {
    errors.email = 'Saisis une adresse e-mail valide (ex. : toi@supcom.tn).';
  }
  if (!CONTACT_SUBJECTS.includes(value.subject)) errors.subject = 'Choisis un sujet dans la liste.';
  checkText(errors, 'message', value.message, LIMITS.message);
  return { value, errors };
}

// PATCH /api/users/me : on ne change que ce qui est envoyé (nom et/ou préférences).
export function validateProfile(body = {}) {
  const value = {};
  const errors = {};
  if (body.name !== undefined) {
    value.name = text(body.name);
    checkText(errors, 'name', value.name, LIMITS.name);
  }
  if (body.preferences !== undefined) {
    const p = body.preferences ?? {};
    value.preferences = {};
    if (p.uiMode !== undefined) {
      if (UI_MODES.includes(p.uiMode)) value.preferences.uiMode = p.uiMode;
      else errors.uiMode = 'Choisis l’habillage « classique » ou « fiche ».';
    }
    if (p.reduceMotion !== undefined) {
      if (typeof p.reduceMotion === 'boolean') value.preferences.reduceMotion = p.reduceMotion;
      else errors.reduceMotion = 'Valeur attendue : vrai ou faux.';
    }
  }
  return { value, errors };
}

// POST et PUT /api/teacher/questions
export function validateQuestion(body = {}, conceptIds = []) {
  const value = {
    conceptId: text(body.conceptId),
    text: text(body.text),
    choices: Array.isArray(body.choices) ? body.choices.map(text) : [],
    correctIndex: body.correctIndex,
    explanation: text(body.explanation),
  };
  const errors = {};
  if (!conceptIds.includes(value.conceptId)) errors.conceptId = 'Choisis un concept de la liste.';
  checkText(errors, 'text', value.text, LIMITS.questionText);

  if (value.choices.length < 2 || value.choices.length > 4) {
    errors.choices = 'Il faut entre 2 et 4 choix.';
  } else if (value.choices.some((c) => !c)) {
    errors.choices = 'Un des choix est vide.';
  } else if (value.choices.some((c) => c.length > LIMITS.choice.max)) {
    errors.choices = `Chaque choix fait ${LIMITS.choice.max} caractères maximum.`;
  } else if (new Set(value.choices.map((c) => c.toLowerCase())).size !== value.choices.length) {
    errors.choices = 'Deux choix sont identiques.';
  }

  if (
    !Number.isInteger(value.correctIndex) ||
    value.correctIndex < 0 ||
    value.correctIndex >= value.choices.length
  ) {
    errors.correctIndex = 'Indique la bonne réponse parmi les choix.';
  }
  checkText(errors, 'explanation', value.explanation, LIMITS.explanation);
  return { value, errors };
}

// Réponse 400 commune : un message général + le détail champ par champ.
export function sendValidationError(res, errors) {
  return res.status(400).json({
    error: 'Le formulaire contient des erreurs : corrige les champs indiqués.',
    fields: errors,
  });
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
