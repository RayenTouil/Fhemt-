// Tests des deux règles du MVP, avec le testeur intégré à Node (aucune installation).
// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextLevel, statusOf } from '../src/services/mastery.js';
import { buildPath } from '../src/services/path.js';

// Un mini-cours : A -> B -> C (A est un prérequis de B, B de C)
const concepts = [
  { id: 'a', title: 'A', prerequisites: [] },
  { id: 'b', title: 'B', prerequisites: ['a'] },
  { id: 'c', title: 'C', prerequisites: ['b'] },
];

test('maîtrise : +20 pour une bonne réponse, -10 pour une mauvaise', () => {
  assert.equal(nextLevel(40, true), 60);
  assert.equal(nextLevel(40, false), 30);
  assert.equal(nextLevel(undefined, true), 20); // jamais évalué = part de 0
});

test('maîtrise : le niveau reste entre 0 et 100', () => {
  assert.equal(nextLevel(95, true), 100);
  assert.equal(nextLevel(5, false), 0);
});

test('statut : maîtrisé à 70, en cours à 30, faible en dessous', () => {
  assert.equal(statusOf(70), 'mastered');
  assert.equal(statusOf(69), 'in-progress');
  assert.equal(statusOf(30), 'in-progress');
  assert.equal(statusOf(29), 'weak');
  assert.equal(statusOf(undefined), 'not-assessed');
});

test('parcours : sans évaluation, on commence par des quiz de diagnostic dans l’ordre du cours', () => {
  const steps = buildPath(concepts, {});
  assert.deepEqual(steps.map((s) => s.conceptId), ['a', 'b', 'c']);
  assert.ok(steps.every((s) => s.kind === 'diagnostic'));
});

test('parcours : un prérequis faible passe avant le concept qui en dépend, avec la raison', () => {
  const steps = buildPath(concepts, { a: 20, b: 10 });
  assert.equal(steps[0].conceptId, 'a');
  assert.equal(steps[0].kind, 'prerequisite');
  assert.match(steps[0].reason, /prérequis pour « B »/);
});

test('parcours : les concepts maîtrisés sont ignorés', () => {
  const steps = buildPath(concepts, { a: 90, b: 40 });
  assert.equal(steps[0].conceptId, 'b');
  assert.equal(steps[0].kind, 'practice');
  assert.ok(!steps.some((s) => s.conceptId === 'a'));
});

test('parcours : tout est maîtrisé, il est vide', () => {
  assert.equal(buildPath(concepts, { a: 80, b: 80, c: 80 }).length, 0);
});

test('parcours : au plus 3 étapes', () => {
  const many = Array.from({ length: 6 }, (_, i) => ({ id: 'k' + i, title: 'K' + i, prerequisites: [] }));
  assert.equal(buildPath(many, {}).length, 3);
});
