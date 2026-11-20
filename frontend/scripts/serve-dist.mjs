// npm run serve:dist : sert le site compilé (dist/fhemt/browser) sur http://localhost:4300
//
// À quoi ça sert ? À tester la VRAIE version de production (mode démo, comme sur fhemt.me)
// sur ton ordinateur, par exemple pour mesurer le score Lighthouse. `ng serve` sert une version
// de développement non optimisée : ses scores ne veulent rien dire.
//
// Le serveur imite GitHub Pages sur deux points :
//   - il compresse les fichiers texte en gzip (GitHub Pages le fait aussi) ;
//   - une adresse inconnue (/dashboard, /quiz/…) renvoie index.html : Angular affiche la bonne page.
// Aucune dépendance : seulement les modules intégrés à Node.
//
// Usage : npm run build puis npm run serve:dist   (PORT=5000 npm run serve:dist pour changer de port)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'fhemt', 'browser');
const port = Number(process.env.PORT) || 4300;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt']);

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('Aucun site compilé trouvé. Lance d’abord « npm run build ».');
  process.exit(1);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.join(root, urlPath);
    // Sécurité : on ne sert jamais un fichier en dehors du dossier du site.
    if (!file.startsWith(root)) file = path.join(root, 'index.html');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');

    const ext = path.extname(file);
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream' };
    // Les fichiers avec une empreinte dans leur nom (main-AB12CD.js) ne changent jamais : cache long.
    headers['Cache-Control'] = /-[A-Z0-9]{8}\.(js|css)$/.test(file)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';

    const body = fs.readFileSync(file);
    if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers);
      res.end(zlib.gzipSync(body));
    } else {
      res.writeHead(200, headers);
      res.end(body);
    }
  })
  .listen(port, () => console.log(`Site compilé servi sur http://localhost:${port}`));
