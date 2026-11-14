# Fhemt ? · frontend (Angular 22)

Le client web de Fhemt ? : 7 pages, composants standalone, signals, router avec guards, `HttpClient` avec un intercepteur.
Le produit, les fonctionnalités et l'API sont décrits dans le [README principal](../README.md).

## Commandes

```bash
npm install
npm start          # http://localhost:4200, attend l'API sur http://localhost:3000 (voir ../backend)
npm run build      # compilation de production dans dist/fhemt/browser (mode démo, voir plus bas)
npm test           # tests unitaires (Vitest)
npm run deploy     # compile et publie le site sur https://fhemt.me
```

## Où se trouve quoi

| Chemin | Rôle |
|---|---|
| `src/app/app.routes.ts` | le plan du site : une route par page, guards « connecté » et « enseignant » |
| `src/app/app.config.ts` | providers : router, HttpClient + intercepteur, choix entre vraie API et mode démo |
| `src/app/core/api.ts` | `ApiService` : une méthode par route du backend ; `authInterceptor` ajoute l'en-tête `x-user-id` |
| `src/app/core/demo-api.ts` | `DemoApi` : les mêmes méthodes, exécutées dans le navigateur quand il n'y a pas de backend |
| `src/app/core/auth.ts` | qui est connecté (signal + localStorage) |
| `src/app/core/guards.ts` | `authGuard`, `teacherGuard` |
| `src/app/core/models.ts` | les interfaces TypeScript des données échangées avec l'API |
| `src/app/core/levels.ts` | seuils (70 % maîtrisé, 30 % en cours), libellés et couleurs des statuts |
| `src/app/pages/*` | home, login, dashboard, quiz, path, concept-map, teacher |
| `src/app/shared/navbar` | barre de navigation selon le rôle |
| `src/styles.css` | tout le design system (couleurs, boutons, cartes, barres, carte de chaleur) |
| `src/environments/` | `apiUrl` en développement (localhost) et en production (vide = mode démo) |
| `public/demo/*.json` | copie de `backend/data/seed` utilisée par le mode démo |
| `scripts/deploy.mjs` | publication sur fhemt.me |

## Mode démo

`environment.prod.ts` a un `apiUrl` vide : la compilation de production (celle publiée sur https://fhemt.me)
injecte donc `DemoApi` à la place d'`ApiService`. Mêmes données, mêmes règles, progression gardée dans le
`localStorage`. Pour brancher le site sur un backend hébergé, mets son adresse dans `apiUrl` (voir `../render.yaml`).

Si tu modifies les fichiers de `backend/data/seed`, recopie-les dans `public/demo/`.

## Publier sur fhemt.me

```bash
npm run deploy
```

Le script compile le site, le copie dans le dépôt `RayenTouil.github.io` (celui que GitHub Pages sert sur
fhemt.me) avec `CNAME`, `404.html` et `.nojekyll`, puis fait un commit et un push. `404.html` est une copie
d'`index.html` : GitHub Pages ne connaît pas les routes Angular (`/dashboard`, `/quiz/…`), il renvoie cette page
et Angular affiche la bonne.
