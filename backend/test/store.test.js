// Le stockage doit accepter une base créée par une version plus ancienne (objectif 3),
// qui n'avait pas encore la collection « messages ».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMessage, getMessages, getUser, initStore } from '../src/store.js';

test('initStore complète une ancienne base sans perdre ses données', async () => {
  const file = path.join(os.tmpdir(), `fhemt-old-db-${process.pid}.json`);
  const oldDb = {
    concepts: [],
    questions: [],
    users: [{ id: 'u-old', email: 'old@fhemt.tn', name: 'Ancien', role: 'student' }],
    mastery: [],
    answers: [],
  };
  fs.writeFileSync(file, JSON.stringify(oldDb));
  process.env.FHEMT_DB_FILE = file;
  try {
    await initStore();
    assert.equal(getUser('u-old').name, 'Ancien'); // les données existantes sont gardées
    assert.deepEqual(getMessages(), []); // la nouvelle collection est ajoutée
    await createMessage({ name: 'Test', email: 't@t.tn', subject: 'Autre', message: 'Bonjour à tous' });
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).messages.length, 1); // et enregistrée
  } finally {
    fs.rmSync(file, { force: true });
  }
});
