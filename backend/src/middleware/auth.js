// Contrôle d'accès du MVP.
// Le frontend envoie l'identifiant de l'utilisateur connecté dans l'en-tête `x-user-id`.
// (Avec Firebase plus tard, cet en-tête deviendra un jeton signé que l'on vérifiera.)
import { getUser } from '../store.js';

const ROLE_LABELS = { student: 'étudiant', teacher: 'enseignant', admin: 'administrateur' };

// Vérification 0 : quelqu'un est-il connecté ?
export function requireUser(req, res, next) {
  const user = getUser(req.header('x-user-id') || '');
  if (!user) return res.status(401).json({ error: "Connecte-toi d'abord." });
  req.user = user; // l'utilisateur est maintenant disponible dans la route
  next();
}

// Vérification 1 (RBAC) : le rôle autorise-t-il cette action ?
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const allowed = roles.map((r) => ROLE_LABELS[r] || r).join(' ou ');
      return res.status(403).json({ error: `Cette page est réservée aux comptes ${allowed}.` });
    }
    next();
  };
}
