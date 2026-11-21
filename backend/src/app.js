// L'application Express de Fhemt ? : les middlewares et toutes les routes.
//
// Pourquoi un fichier séparé de server.js ? Ici on CONSTRUIT l'application ; server.js la
// DÉMARRE (écoute sur un port). Les tests (test/api.test.js) peuvent ainsi créer l'application
// et l'appeler sur un port libre, sans lancer le vrai serveur.
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import conceptRoutes from './routes/concepts.js';
import contactRoutes from './routes/contact.js';
import quizRoutes from './routes/quiz.js';
import masteryRoutes from './routes/mastery.js';
import pathRoutes from './routes/path.js';
import teacherRoutes from './routes/teacher.js';
import userRoutes from './routes/users.js';

export function createApp() {
  const app = express();

  // Middleware = du code exécuté à chaque requête, avant les routes.
  app.use(cors()); // le serveur de dev Angular tourne sur un autre port (4200)
  app.use(express.json()); // transforme le corps JSON de la requête en objet req.body

  // Les routes, regroupées par fonctionnalité (un fichier chacune dans src/routes).
  app.use('/api/auth', authRoutes);
  app.use('/api/concepts', conceptRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/mastery', masteryRoutes);
  app.use('/api/path', pathRoutes);
  app.use('/api/teacher', teacherRoutes);
  app.use('/api/users', userRoutes);

  // Test de santé : ouvre http://localhost:3000/api/health pour vérifier que l'API tourne.
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'fhemt-backend', time: new Date().toISOString() });
  });

  // Toute autre adresse sous /api renvoie une erreur 404 en JSON (et non une page HTML).
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Aucune route pour ${req.method} ${req.originalUrl}` });
  });

  // Gestion centrale des erreurs : si une route plante, le client reçoit une erreur JSON propre.
  // (Express 5 envoie ici aussi les erreurs des fonctions async, sans try/catch.)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: "Le corps de la requête n'est pas un JSON valide." });
    }
    if (!err.status || err.status >= 500) console.error(err);
    res.status(err.status || 500).json({ error: err.expose ? err.message : 'Erreur du serveur.' });
  });

  return app;
}
