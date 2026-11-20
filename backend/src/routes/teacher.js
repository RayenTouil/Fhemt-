// Routes de l'espace enseignant. TOUTES sont réservées aux rôles teacher et admin :
// les deux vérifications (requireUser puis requireRole) sont posées une fois pour tout le fichier.
//
// GET  /api/teacher/heatmap                -> la carte de chaleur de la classe
// GET  /api/teacher/questions?conceptId=…  -> les questions d'un concept, AVEC les réponses
// POST /api/teacher/questions              -> créer une question
// PUT  /api/teacher/questions/:id          -> modifier une question
import { Router } from 'express';
import { requireUser, requireRole } from '../middleware/auth.js';
import {
  createQuestion,
  getConcept,
  getConcepts,
  getMasteryForUser,
  getQuestion,
  getQuestionsForConcept,
  getUsersByRole,
  updateQuestion,
} from '../store.js';
import { hasErrors, sendValidationError, validateQuestion } from '../services/validation.js';

const router = Router();
router.use(requireUser, requireRole('teacher', 'admin'));

router.get('/heatmap', (req, res) => {
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

router.get('/questions', (req, res) => {
  const conceptId = String(req.query.conceptId || '');
  if (!getConcept(conceptId)) return res.status(404).json({ error: 'Concept inconnu.' });
  // Ici on renvoie correctIndex et l'explication : la route est réservée aux enseignants.
  res.json({ questions: getQuestionsForConcept(conceptId) });
});

router.post('/questions', async (req, res) => {
  const { value, errors } = validateQuestion(req.body, getConcepts().map((c) => c.id));
  if (hasErrors(errors)) return sendValidationError(res, errors);
  const question = await createQuestion(value, req.user.id);
  res.status(201).json({ question });
});

router.put('/questions/:id', async (req, res) => {
  if (!getQuestion(req.params.id)) return res.status(404).json({ error: 'Question inconnue.' });
  const { value, errors } = validateQuestion(req.body, getConcepts().map((c) => c.id));
  if (hasErrors(errors)) return sendValidationError(res, errors);
  const question = await updateQuestion(req.params.id, value, req.user.id);
  res.json({ question });
});

export default router;
