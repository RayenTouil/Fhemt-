// POST /api/auth/login  { email, name }
// Connexion de démonstration du MVP : l'e-mail identifie le compte ; les nouveaux comptes
// sont des étudiants (le rôle est décidé par le serveur, comme prévu à l'objectif 1).
// La connexion Google via Firebase remplacera cette route au prochain objectif.
import { Router } from 'express';
import { getUserByEmail, createUser } from '../store.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim();
    const name = (req.body?.name || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Saisis une adresse e-mail valide.' });
    }
    let user = getUserByEmail(email);
    if (!user) {
      if (name.length < 2) {
        return res.status(400).json({ error: 'Saisis ton nom (2 caractères minimum).' });
      }
      user = await createUser({ email, name, role: 'student' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
