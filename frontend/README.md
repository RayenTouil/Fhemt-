# Fhemt ? · frontend (Angular 22)

Le client web de Fhemt ? : 12 pages chargées à la demande, des composants réutilisables, signals et `rxResource`, router avec guards, `HttpClient` avec un intercepteur, formulaires réactifs.
Le produit, les fonctionnalités et l'API sont décrits dans le [README principal](../README.md).

## Commandes

```bash
npm install
npm start          # http://localhost:4200, attend l'API sur http://localhost:3000 (voir ../backend)
npm run build      # compilation de production dans dist/fhemt/browser (mode démo, voir plus bas)
npm test           # tests unitaires (Vitest)
npm run lint       # ESLint (TypeScript, Angular, accessibilité des templates)
npm run format     # met le code en forme avec Prettier (format:check vérifie seulement)
npm run serve:dist # sert le site compilé sur http://localhost:4300 (Lighthouse, parcours e2e)
npm run e2e        # parcours complet dans Chrome et Edge (une fois : npm i --no-save puppeteer-core)
npm run deploy     # compile et publie le site sur https://fhemt.me
```

## Où se trouve quoi

| Chemin                                                        | Rôle                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/app.routes.ts`                                       | le plan du site : une route par page (lazy loading), guards « connecté » et « enseignant »                                                        |
| `src/app/app.config.ts`                                       | providers : router (défilement, transitions, préchargement), HttpClient + intercepteur, vraie API ou mode démo                                    |
| `src/app/pages/*`                                             | une page par route : home, about, contact, login, dashboard, path, concept-map, quiz, profile, teacher, question-editor, not-found                |
| `src/app/shared/*`                                            | composants réutilisables : navbar, footer, page-header, mastery-bar, status-badge, mastery-legend, form-field, skeleton, empty-state, error-state |
| `src/app/core/api.ts`                                         | `ApiService` : une méthode par route du backend ; `authInterceptor` ajoute l'en-tête `x-user-id` ; messages d'erreur                              |
| `src/app/core/demo-api.ts`                                    | `DemoApi` : les mêmes méthodes (`implements ApiContract`), exécutées dans le navigateur quand il n'y a pas de backend                             |
| `src/app/core/validation.ts`                                  | règles des formulaires, identiques à `backend/src/services/validation.js`                                                                         |
| `src/app/core/forms.ts`                                       | transforme une erreur de formulaire en phrase française                                                                                           |
| `src/app/core/ui-mode.ts`                                     | préférences d'affichage : habillage fiche, animations réduites                                                                                    |
| `src/app/core/preloading.ts`                                  | préchargement des pages 2 s après l'arrivée                                                                                                       |
| `src/app/core/auth.ts`, `guards.ts`, `models.ts`, `levels.ts` | utilisateur connecté, guards, interfaces des données, seuils et libellés                                                                          |
| `src/styles.css`                                              | le design system : variables (couleurs, espacements, rayons, ombres), composants, animations                                                      |
| `src/ui-fiche.css`                                            | le second habillage, « fiche de révision »                                                                                                        |
| `src/environments/`                                           | `apiUrl` en développement (localhost) et en production (vide = mode démo)                                                                         |
| `public/`                                                     | favicon SVG, `robots.txt`, `sitemap.xml`, `demo/*.json` (copie de `backend/data/seed`)                                                            |
| `e2e/parcours.mjs`                                            | le parcours complet dans de vrais navigateurs                                                                                                     |
| `scripts/`                                                    | `deploy.mjs` (publication sur fhemt.me), `serve-dist.mjs` (serveur local du site compilé)                                                         |

## Mode démo

`environment.prod.ts` a un `apiUrl` vide : la compilation de production (celle publiée sur https://fhemt.me)
injecte donc `DemoApi` à la place d'`ApiService`. Mêmes données, mêmes règles, progression gardée dans le
`localStorage`. Pour brancher le site sur un backend hébergé, mets son adresse dans `apiUrl` (voir `../render.yaml`).

Si tu modifies les fichiers de `backend/data/seed`, recopie-les dans `public/demo/` : le test `backend/test/seed-sync.test.js` échoue tant que les deux dossiers diffèrent.

## Publier sur fhemt.me

```bash
npm run deploy
```

Le script compile le site, le copie dans le dépôt `RayenTouil.github.io` (celui que GitHub Pages sert sur
fhemt.me) avec `CNAME`, `404.html` et `.nojekyll`, puis fait un commit et un push. `404.html` est une copie
d'`index.html` : GitHub Pages ne connaît pas les routes Angular (`/dashboard`, `/quiz/…`), il renvoie cette page
et Angular affiche la bonne.
