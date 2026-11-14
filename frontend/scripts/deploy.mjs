// npm run deploy : compile le site et le publie sur https://fhemt.me
//
// Comment ça marche ? Le domaine fhemt.me (acheté chez Namecheap) pointe vers GitHub Pages,
// et GitHub Pages sert le dépôt RayenTouil.github.io. Ce script :
//   1. compile l'application Angular (mode démo, voir src/environments/environment.prod.ts) ;
//   2. clone RayenTouil.github.io dans un dossier temporaire ;
//   3. remplace son contenu par le site compilé (+ CNAME, 404.html, .nojekyll) ;
//   4. fait un commit et un push. GitHub Pages met le site à jour en une minute environ.
//
// Usage : npm run deploy            (depuis le dossier frontend)
//         npm run deploy -- "texte" (ajoute un texte à la fin du message de commit)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_REPO = 'https://github.com/RayenTouil/RayenTouil.github.io.git';
const DOMAIN = 'fhemt.me';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(frontendDir, 'dist', 'fhemt', 'browser');
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const read = (cmd, cwd) => execSync(cmd, { cwd, encoding: 'utf8' }).trim();

console.log('1/4 Compilation du site…');
run('npm run build', frontendDir);

console.log('2/4 Récupération du dépôt du site…');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fhemt-deploy-'));
run(`git clone --depth 1 ${SITE_REPO} "${work}"`);

console.log('3/4 Copie des fichiers compilés…');
for (const entry of fs.readdirSync(work)) {
  if (entry !== '.git') fs.rmSync(path.join(work, entry), { recursive: true, force: true });
}
fs.cpSync(distDir, work, { recursive: true });
// GitHub Pages ne connaît pas les routes Angular (/dashboard, /quiz/…) : il renvoie 404.html,
// qui est une copie de index.html, et Angular affiche alors la bonne page.
fs.copyFileSync(path.join(work, 'index.html'), path.join(work, '404.html'));
fs.writeFileSync(path.join(work, 'CNAME'), DOMAIN + '\n');
fs.writeFileSync(path.join(work, '.nojekyll'), ''); // servir les fichiers tels quels
const sourceSha = read('git rev-parse --short HEAD', frontendDir);
fs.writeFileSync(
  path.join(work, 'README.md'),
  `# fhemt.me\n\nSite compilé de **Fhemt ?**, publié automatiquement par \`npm run deploy\`.\n\n` +
    `Ne pas modifier ici : le code source est dans https://github.com/RayenTouil/Fhemt- ` +
    `(version déployée : ${sourceSha}).\n`,
);

console.log('4/4 Publication…');
run('git add -A', work);
if (!read('git status --porcelain', work)) {
  console.log('Aucun changement : le site en ligne est déjà à jour.');
} else {
  const extra = process.argv.slice(2).join('\n');
  const message = `deploy: ${sourceSha}` + (extra ? `\n\n${extra}` : '');
  const msgFile = path.join(work, '..', `fhemt-deploy-msg-${Date.now()}.txt`);
  fs.writeFileSync(msgFile, message);
  run(`git commit -q -F "${msgFile}"`, work);
  fs.rmSync(msgFile);
  run('git push origin HEAD', work);
  console.log(`Publié. Le site sera à jour sur https://${DOMAIN} dans une minute environ.`);
}
fs.rmSync(work, { recursive: true, force: true });
