// `npm run reset` : reconstruit data/db.json à partir des fichiers seed.
import { resetStore } from './store.js';

await resetStore();
console.log('data/db.json réinitialisé à partir des fichiers seed.');
