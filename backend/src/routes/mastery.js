// GET /api/mastery/me : les données du tableau de bord de l'étudiant connecté.
import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { getConcepts, getMasteryForUser } from '../store.js';
import { statusOf, MASTERED, IN_PROGRESS } from '../services/mastery.js';

const router = Router();

router.get('/me', requireUser, (req, res) => {
  const levels = getMasteryForUser(req.user.id);
  const concepts = getConcepts().map((c) => ({
    id: c.id,
    title: c.title,
    short: c.short,
    summary: c.summary,
    prerequisites: c.prerequisites,
    level: levels[c.id] ?? null,
    status: statusOf(levels[c.id]),
  }));
  // Global = moyenne sur TOUS les concepts (un concept jamais évalué compte pour 0).
  const overall = Math.round(concepts.reduce((s, c) => s + (c.level ?? 0), 0) / concepts.length);

  res.json({
    concepts,
    overall,
    counts: {
      mastered: concepts.filter((c) => c.status === 'mastered').length,
      inProgress: concepts.filter((c) => c.status === 'in-progress').length,
      weak: concepts.filter((c) => c.status === 'weak').length,
      notAssessed: concepts.filter((c) => c.status === 'not-assessed').length,
    },
    thresholds: { mastered: MASTERED, inProgress: IN_PROGRESS },
  });
});

export default router;
