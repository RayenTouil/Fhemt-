// Point d'entrée du backend de Fhemt ? : `npm start` ou `npm run dev`.
// L'application elle-même (middlewares + routes) est construite dans app.js.
import { createApp } from './app.js';
import { initStore } from './store.js';

const PORT = process.env.PORT || 3000;

// Crée data/db.json à partir des fichiers seed s'il n'existe pas encore, puis écoute.
await initStore();
createApp().listen(PORT, () => {
  console.log(`API Fhemt ? prête sur http://localhost:${PORT}/api/health`);
});
