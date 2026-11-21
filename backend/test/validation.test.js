// Tests des règles de validation (fonctions pures : pas besoin de serveur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContact, validateProfile, validateQuestion } from '../src/services/validation.js';

test('contact : un message complet est accepté et nettoyé', () => {
  const { value, errors } = validateContact({
    name: ' Amira ',
    email: 'AMIRA@fhemt.tn',
    subject: 'Autre',
    message: 'Bonjour, une question sur le quiz.',
  });
  assert.deepEqual(errors, {});
  assert.equal(value.name, 'Amira');
  assert.equal(value.email, 'amira@fhemt.tn');
});

test('contact : chaque champ manquant a son message', () => {
  const { errors } = validateContact({});
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name', 'subject']);
});

test('profil : seuls les champs envoyés sont validés', () => {
  assert.deepEqual(validateProfile({ preferences: { reduceMotion: true } }), {
    value: { preferences: { reduceMotion: true } },
    errors: {},
  });
  assert.ok(validateProfile({ name: 'x'.repeat(61) }).errors.name);
  assert.ok(validateProfile({ preferences: { reduceMotion: 'oui' } }).errors.reduceMotion);
});

test('question : 2 à 4 choix, tous différents, et une bonne réponse parmi eux', () => {
  const base = { conceptId: 'a', text: 'Une question assez longue ?', explanation: 'Une explication.' };
  const ok = validateQuestion({ ...base, choices: ['Oui', 'Non'], correctIndex: 1 }, ['a']);
  assert.deepEqual(ok.errors, {});
  assert.ok(validateQuestion({ ...base, choices: ['Seul'], correctIndex: 0 }, ['a']).errors.choices);
  assert.equal(
    validateQuestion({ ...base, choices: ['Oui', 'oui'], correctIndex: 0 }, ['a']).errors.choices,
    'Deux choix sont identiques.',
  );
  assert.ok(validateQuestion({ ...base, choices: ['Oui', 'Non'], correctIndex: 2 }, ['a']).errors.correctIndex);
  assert.ok(validateQuestion({ ...base, choices: ['Oui', 'Non'], correctIndex: 0 }, ['b']).errors.conceptId);
});
