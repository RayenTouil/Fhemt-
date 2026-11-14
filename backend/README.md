# Fhemt ? · backend (Node.js + Express 5)

L'API REST minimale du MVP. Le produit et les pages sont décrits dans le [README principal](../README.md).

## Commandes

```bash
npm install
npm run dev        # http://localhost:3000, redémarre à chaque modification (node --watch)
npm start          # pareil, sans redémarrage automatique
npm test           # tests des règles de maîtrise et de parcours
npm run reset      # reconstruit data/db.json à partir de data/seed
```

`GET http://localhost:3000/api/health` indique si l'API tourne.

## Routes

| Méthode | Route | Pour qui | Quoi |
|---|---|---|---|
| POST | `/api/auth/login` | tout le monde | `{ email, name }` → le compte (les nouveaux comptes sont étudiants) |
| GET | `/api/concepts` | tout le monde | les 8 concepts avec leurs prérequis |
| GET | `/api/mastery/me` | connecté | niveau et statut par concept, niveau global, compteurs |
| GET | `/api/path/me` | connecté | les prochaines étapes avec leur raison |
| GET | `/api/quiz/:conceptId` | connecté | les questions (sans les réponses) |
| POST | `/api/quiz/answer` | connecté | `{ questionId, choiceIndex }` → correct ?, explication, maîtrise avant/après |
| GET | `/api/teacher/heatmap` | enseignant, admin | étudiants × concepts, moyennes de la classe, concept bloquant |

« Connecté » signifie que la requête porte l'en-tête `x-user-id` (ajouté par l'intercepteur Angular).
Les vérifications de rôle sont dans `src/middleware/auth.js`. Codes d'erreur : 400 (données invalides),
401 (pas connecté), 403 (rôle insuffisant), 404 (introuvable).

## Fichiers

| Chemin | Rôle |
|---|---|
| `src/server.js` | crée l'application, les middlewares (cors, json), monte les routes, gère les erreurs |
| `src/routes/*.js` | un fichier par fonctionnalité |
| `src/services/mastery.js` | la règle : +20 / −10, maîtrisé à partir de 70 % |
| `src/services/path.js` | la règle : un prérequis faible passe avant le concept qui en dépend |
| `src/store.js` | stockage dans un fichier JSON ; les fonctions ont la forme de futures requêtes MongoDB |
| `data/seed/*.json` | concepts, questions, comptes et maîtrise de démonstration |
| `data/db.json` | données d'exécution, créées à partir du seed, ignorées par git |
| `test/rules.test.js` | 8 tests des deux règles |

## Hébergement (optionnel)

`../render.yaml` décrit un service web gratuit sur Render pour ce dossier. L'offre gratuite se met en veille
quand personne ne l'utilise et remet `data/db.json` à zéro à chaque redémarrage, ce qui convient pour une démo.
