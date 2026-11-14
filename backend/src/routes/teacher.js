// GET /api/teacher/heatmap : la vue de la classe. Comptes enseignant uniquement (vérification RBAC).
import { Router } from 'express';
import { requireUser, requireRole } from '../middleware/auth.js';
import { getConcepts, getUsersByRole, getMasteryForUser } from '../store.js';

const router = Router();

router.get('/heatmap', requireUser, requireRole('teacher', 'admin'), (req, res) => {
  const concepts = getConcepts();
  const students = getUsersByRole('student').map((s) => ({
    id: s.id,
    name: s.name,
    levels: getMasteryForUser(s.id),
  }));

  // Moyenne de la classe par concept, sur les étudiants évalués sur ce concept
  // (null quand personne n'a encore été évalué).
  const averages = {};
  for (const c of concepts) {
    const assessed = students.map((s) => s.levels[c.id]).filter((l) => l !== undefined);
    averages[c.id] = assessed.length ? Math.round(assessed.reduce((a, b) => a + b, 0) / assessed.length) : null;
  }
  // Le concept où la classe bloque le plus = la moyenne la plus basse parmi les concepts évalués.
  const candidates = concepts.filter((c) => averages[c.id] !== null);
  const blocking = candidates.length
    ? candidates.reduce((worst, c) => (averages[c.id] < averages[worst.id] ? c : worst), candidates[0])
    : null;

  res.json({
    concepts: concepts.map(({ id, title, short }) => ({ id, title, short })),
    students,
    averages,
    blockingConcept: blocking ? { id: blocking.id, title: blocking.title, average: averages[blocking.id] } : null,
  });
});

export default router;
