// GET /api/concepts : la liste des concepts du cours, avec leurs prérequis.
import { Router } from 'express';
import { getConcepts, getQuestionsForConcept } from '../store.js';

const router = Router();

router.get('/', (req, res) => {
  const concepts = getConcepts().map((c) => ({
    ...c,
    questionCount: getQuestionsForConcept(c.id).length,
  }));
  res.json({ concepts });
});

export default router;
