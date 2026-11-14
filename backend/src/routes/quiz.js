// GET  /api/quiz/:conceptId  -> les questions d'un concept (sans les réponses !)
// POST /api/quiz/answer      -> { questionId, choiceIndex } : corrige + met à jour la maîtrise
import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import {
  getConcept,
  getQuestionsForConcept,
  getQuestion,
  getMasteryForUser,
  setMastery,
  logAnswer,
} from '../store.js';
import { nextLevel, statusOf } from '../services/mastery.js';

const router = Router();

router.get('/:conceptId', requireUser, (req, res) => {
  const concept = getConcept(req.params.conceptId);
  if (!concept) return res.status(404).json({ error: 'Concept inconnu.' });
  // On n'envoie jamais correctIndex ni l'explication au navigateur avant la réponse.
  const questions = getQuestionsForConcept(concept.id).map(({ id, text, choices }) => ({ id, text, choices }));
  const level = getMasteryForUser(req.user.id)[concept.id] ?? null;
  res.json({ concept, questions, level });
});

router.post('/answer', requireUser, async (req, res, next) => {
  try {
    const { questionId, choiceIndex } = req.body || {};
    const question = getQuestion(questionId);
    if (!question) return res.status(404).json({ error: 'Question inconnue.' });
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= question.choices.length) {
      return res.status(400).json({ error: "choiceIndex doit être l'indice de l'un des choix." });
    }

    const isCorrect = choiceIndex === question.correctIndex;
    const before = getMasteryForUser(req.user.id)[question.conceptId];
    const after = nextLevel(before, isCorrect);
    await setMastery(req.user.id, question.conceptId, after);
    await logAnswer({ userId: req.user.id, questionId, conceptId: question.conceptId, choiceIndex, isCorrect });

    res.json({
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      mastery: { before: before ?? 0, after, status: statusOf(after) },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
