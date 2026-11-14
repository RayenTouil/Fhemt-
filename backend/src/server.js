// Point d'entrée du backend de Fhemt ?.
// Une seule application Express : du JSON en entrée, du JSON en sortie, toutes les routes sous /api.
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import conceptRoutes from './routes/concepts.js';
import quizRoutes from './routes/quiz.js';
import masteryRoutes from './routes/mastery.js';
import pathRoutes from './routes/path.js';
import teacherRoutes from './routes/teacher.js';
import { initStore } from './store.js';

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware = du code exécuté à chaque requête, avant les routes.
app.use(cors()); // le serveur de dev Angular tourne sur un autre port (4200)
app.use(express.json()); // transforme le corps JSON de la requête en objet req.body

// Les routes, regroupées par fonctionnalité (un fichier chacune dans src/routes).
app.use('/api/auth', authRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/mastery', masteryRoutes);
app.use('/api/path', pathRoutes);
app.use('/api/teacher', teacherRoutes);

// Test de santé : ouvre http://localhost:3000/api/health pour vérifier que l'API tourne.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'fhemt-backend', time: new Date().toISOString() });
});

// Toute autre adresse sous /api renvoie une erreur 404 en JSON (et non une page HTML).
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Aucune route pour ${req.method} ${req.originalUrl}` });
});

// Gestion centrale des erreurs : si une route plante, le client reçoit une erreur JSON propre.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur du serveur.' });
});

// Crée data/db.json à partir des fichiers seed s'il n'existe pas encore, puis écoute.
await initStore();
app.listen(PORT, () => {
  console.log(`API Fhemt ? prête sur http://localhost:${PORT}/api/health`);
});
