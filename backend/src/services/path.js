// Construit le parcours personnalisé : les prochaines étapes d'un étudiant, chacune avec sa raison.
//
// Règle (volontairement simple et explicable) :
//  1. on parcourt les concepts dans l'ordre du cours et on ignore ceux qui sont maîtrisés (≥ 70 %) ;
//  2. si un concept non maîtrisé a un prérequis non maîtrisé, ce prérequis passe avant lui ;
//  3. si un concept faible bloque un concept suivant déjà commencé, on le dit dans la raison
//     (« … est un prérequis pour Nyquist (10 %) ») : c'est l'étape « Prérequis d'abord » ;
//  4. sinon : quiz de diagnostic (jamais évalué) ou entraînement (évalué mais pas maîtrisé).
// On garde au plus 3 étapes pour que le parcours reste lisible.
import { MASTERED } from './mastery.js';

const MAX_STEPS = 3;

export function buildPath(concepts, levels) {
  const steps = [];
  const byId = Object.fromEntries(concepts.map((c) => [c.id, c]));
  const already = new Set();
  const isMastered = (id) => levels[id] !== undefined && levels[id] >= MASTERED;

  // Les concepts déjà commencés mais pas maîtrisés qui dépendent du concept `id`.
  const blockedBy = (id) =>
    concepts.filter((c) => c.prerequisites.includes(id) && levels[c.id] !== undefined && !isMastered(c.id));

  const push = (concept, reason, kind) => {
    if (already.has(concept.id) || steps.length >= MAX_STEPS) return;
    already.add(concept.id);
    steps.push({ conceptId: concept.id, title: concept.title, level: levels[concept.id] ?? null, reason, kind });
  };

  // La raison d'une étape, selon le niveau du concept et ce qu'il bloque.
  const reasonFor = (concept) => {
    const level = levels[concept.id];
    const blocked = blockedBy(concept.id);
    if (blocked.length) {
      const list = blocked.map((b) => `« ${b.title} » (${levels[b.id]} %)`).join(' et ');
      const where = level === undefined ? 'tu ne l’as pas encore évalué' : `ton niveau y est de ${level} %`;
      return { kind: 'prerequisite', reason: `« ${concept.title} » est un prérequis pour ${list} et ${where}. Consolide-le d'abord.` };
    }
    if (level === undefined) {
      return { kind: 'diagnostic', reason: `Pas encore d'évaluation sur « ${concept.title} » : fais le court quiz de diagnostic.` };
    }
    return { kind: 'practice', reason: `Ton niveau sur « ${concept.title} » est de ${level} %. Entraîne-toi jusqu'à ${MASTERED} %.` };
  };

  for (const concept of concepts) {
    if (steps.length >= MAX_STEPS) break;
    if (isMastered(concept.id)) continue; // maîtrisé : rien à faire

    // un prérequis non maîtrisé passe en premier
    for (const preId of concept.prerequisites) {
      if (!isMastered(preId)) {
        const { reason, kind } = reasonFor(byId[preId]);
        push(byId[preId], reason, kind);
      }
    }
    // puis le concept lui-même
    const { reason, kind } = reasonFor(concept);
    push(concept, reason, kind);
  }
  return steps;
}
