// Réglages de production (ng build, site publié sur https://fhemt.me via GitHub Pages).
// GitHub Pages ne sert que des fichiers statiques : il n'y a pas de serveur Express derrière.
// Avec un apiUrl vide, l'application passe en MODE DÉMO : les mêmes données et les mêmes
// règles s'exécutent dans le navigateur (voir src/app/core/demo-api.ts) et la progression
// est gardée dans le localStorage. Pour utiliser un backend hébergé (par exemple sur Render),
// mets son adresse ici :
//   apiUrl: 'https://fhemt-api.onrender.com/api'
export const environment = {
  production: true,
  apiUrl: '',
};
