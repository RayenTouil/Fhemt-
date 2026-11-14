// GET /api/path/me : les prochaines étapes personnalisées, chacune avec sa raison.
import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { getConcepts, getMasteryForUser } from '../store.js';
import { buildPath } from '../services/path.js';

const router = Router();

router.get('/me', requireUser, (req, res) => {
  const steps = buildPath(getConcepts(), getMasteryForUser(req.user.id));
  res.json({ steps });
});

export default router;
