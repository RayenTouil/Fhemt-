// POST /api/contact  { name, email, subject, message }
// Le formulaire de contact du site (page /contact). Ouvert à tous, même sans compte.
// Le message est enregistré dans la collection « messages » ; l'envoi d'un e-mail à l'équipe
// (Mailjet, prévu dans l'architecture cible) viendra plus tard.
import { Router } from 'express';
import { createMessage, getUser } from '../store.js';
import { hasErrors, sendValidationError, validateContact } from '../services/validation.js';

const router = Router();

router.post('/', async (req, res) => {
  const { value, errors } = validateContact(req.body);
  if (hasErrors(errors)) return sendValidationError(res, errors);
  // Si la personne est connectée, on garde aussi son identifiant (utile pour lui répondre).
  const user = getUser(req.header('x-user-id') || '');
  const message = await createMessage({ ...value, userId: user?.id ?? null });
  // 201 Created : une nouvelle ressource a été créée.
  res.status(201).json({ ok: true, id: message.id });
});

export default router;
