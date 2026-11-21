// PATCH /api/users/me  { name?, preferences?: { uiMode?, reduceMotion? } }
// Mise à jour du profil de l'utilisateur connecté (page /profile du site).
// PATCH = on n'envoie que ce qui change. L'e-mail et le rôle ne sont jamais modifiables ici :
// même si le client les envoie, ils sont ignorés.
import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { updateUser } from '../store.js';
import { hasErrors, sendValidationError, validateProfile } from '../services/validation.js';

const router = Router();

router.patch('/me', requireUser, async (req, res) => {
  const { value, errors } = validateProfile(req.body);
  if (hasErrors(errors)) return sendValidationError(res, errors);
  if (value.name === undefined && value.preferences === undefined) {
    return res.status(400).json({ error: 'Rien à modifier : envoie un nom ou des préférences.' });
  }
  const user = await updateUser(req.user.id, value);
  res.json({ user });
});

export default router;
