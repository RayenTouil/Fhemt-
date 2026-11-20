# Fhemt ? · backend (Node.js + Express 5)

L'API REST minimale du MVP. Le produit et les pages sont décrits dans le [README principal](../README.md).

## Commandes

```bash
npm install
npm run dev        # http://localhost:3000, redémarre à chaque modification (node --watch)
npm start          # pareil, sans redémarrage automatique
npm test           # 30 tests : règles, validation, routes de l'API, synchronisation des seeds
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
| PATCH | `/api/users/me` | connecté | `{ name?, preferences?: { uiMode, reduceMotion } }` → le profil mis à jour (jamais l'e-mail ni le rôle) |
| POST | `/api/contact` | tout le monde | `{ name, email, subject, message }` → 201, message enregistré dans `messages` |
| GET | `/api/teacher/heatmap` | enseignant, admin | étudiants × concepts, moyennes de la classe, concept bloquant |
| GET | `/api/teacher/questions?conceptId=` | enseignant, admin | les questions d'un concept, **avec** les réponses |
| POST | `/api/teacher/questions` | enseignant, admin | `{ conceptId, text, choices, correctIndex, explanation }` → 201, la question créée |
| PUT | `/api/teacher/questions/:id` | enseignant, admin | mêmes champs → la question modifiée |

« Connecté » signifie que la requête porte l'en-tête `x-user-id` (ajouté par l'intercepteur Angular).
Les vérifications de rôle sont dans `src/middleware/auth.js`. Codes d'erreur : 400 (données invalides),
401 (pas connecté), 403 (rôle insuffisant), 404 (introuvable).

Quand un formulaire est refusé (400), la réponse détaille l'erreur champ par champ, et le site
l'affiche sous le bon champ :

```json
{ "error": "Le formulaire contient des erreurs : corrige les champs indiqués.",
  "fields": { "email": "Saisis une adresse e-mail valide (ex. : toi@supcom.tn)." } }
```

## Fichiers

| Chemin | Rôle |
|---|---|
| `src/app.js` | crée l'application : middlewares (cors, json), routes, erreurs JSON (utilisée par les tests) |
| `src/server.js` | prépare la base puis démarre l'application sur le port 3000 |
| `src/routes/*.js` | un fichier par fonctionnalité |
| `src/services/mastery.js` | la règle : +20 / −10, maîtrisé à partir de 70 % |
| `src/services/path.js` | la règle : un prérequis faible passe avant le concept qui en dépend |
| `src/services/validation.js` | les règles des formulaires (contact, profil, questions), mêmes messages que le site |
| `src/store.js` | stockage dans un fichier JSON ; les fonctions ont la forme de futures requêtes MongoDB. Complète automatiquement une ancienne `db.json` |
| `data/seed/*.json` | concepts, questions, comptes, maîtrise et messages de démonstration (copiés à l'identique dans `frontend/public/demo/`) |
| `data/db.json` | données d'exécution, créées à partir du seed, ignorées par git |
| `test/rules.test.js` | les deux règles (maîtrise, parcours) |
| `test/validation.test.js` | les règles des formulaires |
| `test/api.test.js` | les routes de création et de mise à jour, par de vraies requêtes HTTP sur une base temporaire |
| `test/store.test.js` | une ancienne base est complétée sans perte |
| `test/seed-sync.test.js` | `data/seed/` et `frontend/public/demo/` sont identiques (sinon le mode démo diverge) |

## Hébergement (optionnel)

`../render.yaml` décrit un service web gratuit sur Render pour ce dossier. L'offre gratuite se met en veille
quand personne ne l'utilise et remet `data/db.json` à zéro à chaque redémarrage, ce qui convient pour une démo.
