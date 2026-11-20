// Garde-fou du mode démo : le site publié (fhemt.me) n'a pas de serveur, il lit des copies
// des fichiers seed dans frontend/public/demo/. Ce test échoue si les deux dossiers ne
// contiennent plus exactement les mêmes fichiers, avec le même contenu.
// Après avoir modifié un seed :  cp backend/data/seed/*.json frontend/public/demo/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const seedDir = path.join(root, 'backend', 'data', 'seed');
const demoDir = path.join(root, 'frontend', 'public', 'demo');
const jsonFiles = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

test('seed : les mêmes fichiers dans backend/data/seed et frontend/public/demo', () => {
  assert.deepEqual(jsonFiles(demoDir), jsonFiles(seedDir));
});

test('seed : le même contenu dans les deux dossiers', () => {
  for (const file of jsonFiles(seedDir)) {
    const seed = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf8'));
    const demo = JSON.parse(fs.readFileSync(path.join(demoDir, file), 'utf8'));
    assert.deepEqual(demo, seed, `${file} diffère entre les deux dossiers`);
  }
});
