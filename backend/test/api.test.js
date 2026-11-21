// Tests des routes de l'API (création et mise à jour), avec le testeur intégré à Node.
// Chaque test envoie une vraie requête HTTP à l'application, comme le ferait le site.
//
// La base de test est un fichier temporaire (FHEMT_DB_FILE) recréé à partir des seeds :
// data/db.json n'est jamais touché.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { getMessages, resetStore } from '../src/store.js';

process.env.FHEMT_DB_FILE = path.join(os.tmpdir(), `fhemt-test-${process.pid}.json`);

let server;
let base;

before(async () => {
  await resetStore();
  server = createApp().listen(0); // port 0 = un port libre choisi par le système
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => {
  server.close();
  fs.rmSync(process.env.FHEMT_DB_FILE, { force: true });
});

// Envoie une requête et renvoie { status, body }. `user` = l'en-tête x-user-id.
async function call(method, url, { user, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (user) headers['x-user-id'] = user;
  const res = await fetch(base + url, { method, headers, body: body && JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}

const STUDENT = 'u-amira';
const TEACHER = 'u-teacher';

describe('PATCH /api/users/me (mise à jour du profil)', () => {
  test('refuse une personne non connectée (401)', async () => {
    const { status } = await call('PATCH', '/users/me', { body: { name: 'Test' } });
    assert.equal(status, 401);
  });

  test('met à jour le nom et les préférences, jamais le rôle', async () => {
    const { status, body } = await call('PATCH', '/users/me', {
      user: STUDENT,
      body: { name: '  Amira B.  ', role: 'admin', preferences: { uiMode: 'fiche', reduceMotion: true } },
    });
    assert.equal(status, 200);
    assert.equal(body.user.name, 'Amira B.'); // espaces retirés
    assert.equal(body.user.role, 'student'); // le rôle envoyé par le client est ignoré
    assert.deepEqual(body.user.preferences, { uiMode: 'fiche', reduceMotion: true });
  });

  test('refuse un nom trop court, avec le détail par champ (400)', async () => {
    const { status, body } = await call('PATCH', '/users/me', { user: STUDENT, body: { name: 'A' } });
    assert.equal(status, 400);
    assert.equal(body.fields.name, 'Au moins 2 caractères.');
  });

  test('refuse une préférence inconnue (400)', async () => {
    const { status, body } = await call('PATCH', '/users/me', {
      user: STUDENT,
      body: { preferences: { uiMode: 'sombre' } },
    });
    assert.equal(status, 400);
    assert.ok(body.fields.uiMode);
  });
});

describe('POST /api/contact (création d’un message)', () => {
  const valid = {
    name: 'Youssef',
    email: 'Youssef@Fhemt.tn',
    subject: 'Suggestion',
    message: 'Ce serait bien d’avoir plus de questions sur Nyquist.',
  };

  test('enregistre un message valide (201)', async () => {
    const { status, body } = await call('POST', '/contact', { body: valid });
    assert.equal(status, 201);
    const saved = getMessages().find((m) => m.id === body.id);
    assert.equal(saved.email, 'youssef@fhemt.tn');
    assert.equal(saved.userId, null); // envoyé sans être connecté
  });

  test('refuse un e-mail invalide et un message vide (400)', async () => {
    const { status, body } = await call('POST', '/contact', {
      body: { ...valid, email: 'pas-un-email', message: '' },
    });
    assert.equal(status, 400);
    assert.match(body.fields.email, /adresse e-mail valide/);
    assert.equal(body.fields.message, 'Ce champ est obligatoire.');
  });

  test('refuse un sujet qui n’est pas dans la liste (400)', async () => {
    const { status, body } = await call('POST', '/contact', { body: { ...valid, subject: 'Pub' } });
    assert.equal(status, 400);
    assert.ok(body.fields.subject);
  });
});

describe('/api/teacher/questions (création et modification de questions)', () => {
  const question = {
    conceptId: 'sampling',
    text: 'Un CAN échantillonne à 8 kHz. Combien d’échantillons par seconde ?',
    choices: ['8', '800', '8000', '80 000'],
    correctIndex: 2,
    explanation: '8 kHz = 8000 échantillons chaque seconde.',
  };

  test('refuse un étudiant (403) et une personne non connectée (401)', async () => {
    assert.equal((await call('GET', '/teacher/questions?conceptId=sampling', { user: STUDENT })).status, 403);
    assert.equal((await call('POST', '/teacher/questions', { body: question })).status, 401);
  });

  test('liste les questions d’un concept avec les réponses (enseignant)', async () => {
    const { status, body } = await call('GET', '/teacher/questions?conceptId=sampling', { user: TEACHER });
    assert.equal(status, 200);
    assert.ok(body.questions.length >= 3);
    assert.ok(body.questions.every((q) => Number.isInteger(q.correctIndex)));
  });

  test('concept inconnu (404)', async () => {
    const { status } = await call('GET', '/teacher/questions?conceptId=astrologie', { user: TEACHER });
    assert.equal(status, 404);
  });

  test('crée une question qui apparaît ensuite dans le quiz des étudiants (sans la réponse)', async () => {
    const created = await call('POST', '/teacher/questions', { user: TEACHER, body: question });
    assert.equal(created.status, 201);
    assert.equal(created.body.question.createdBy, TEACHER);

    const quiz = await call('GET', '/quiz/sampling', { user: STUDENT });
    const seen = quiz.body.questions.find((q) => q.id === created.body.question.id);
    assert.ok(seen, 'la nouvelle question est dans le quiz');
    assert.equal(seen.correctIndex, undefined); // jamais la réponse côté étudiant
  });

  test('refuse une question invalide, avec le détail par champ (400)', async () => {
    const { status, body } = await call('POST', '/teacher/questions', {
      user: TEACHER,
      body: { ...question, text: 'Court', choices: ['Oui', ''], correctIndex: 5 },
    });
    assert.equal(status, 400);
    assert.ok(body.fields.text);
    assert.equal(body.fields.choices, 'Un des choix est vide.');
    assert.ok(body.fields.correctIndex);
  });

  test('modifie une question existante (PUT)', async () => {
    const { status, body } = await call('PUT', '/teacher/questions/q-sampling-1', {
      user: TEACHER,
      body: { ...question, text: 'Échantillonner un signal, c’est…', correctIndex: 0 },
    });
    assert.equal(status, 200);
    assert.equal(body.question.text, 'Échantillonner un signal, c’est…');
    assert.equal(body.question.updatedBy, TEACHER);
  });

  test('question inconnue (404)', async () => {
    const { status } = await call('PUT', '/teacher/questions/q-nexiste-pas', { user: TEACHER, body: question });
    assert.equal(status, 404);
  });
});

test('une adresse inconnue sous /api renvoie une erreur JSON (404)', async () => {
  const { status, body } = await call('GET', '/nimporte-quoi');
  assert.equal(status, 404);
  assert.match(body.error, /Aucune route/);
});
