// npm run e2e : le parcours complet d'un utilisateur, joué automatiquement dans de vrais
// navigateurs (Chrome, Edge et Firefox), en largeur téléphone (360 px) et ordinateur (1280 px).
//
// Parcours : accueil → connexion démo (Amira) → tableau de bord → quiz → profil → déconnexion
//            → connexion enseignant → carte de chaleur → création d'une question.
// Sur téléphone, la navigation passe par le menu burger, comme le ferait un utilisateur.
//
// Prérequis (une seule fois) :  npm i --no-save puppeteer-core
// Puis :                         npm run build  →  npm run serve:dist  (dans un autre terminal)
//                                npm run e2e
// Le script utilise les navigateurs déjà installés sur l'ordinateur (rien à télécharger).
// Un navigateur absent est signalé « non installé », sans faire échouer le parcours.
// Variables utiles : BASE_URL (défaut http://localhost:4300), BROWSERS=chrome,edge,firefox,
// WIDTHS=360,1280, et CHROME_PATH / EDGE_PATH / FIREFOX_PATH pour un navigateur rangé ailleurs
// (par exemple un Firefox portable).
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://localhost:4300';
const WIDTHS = (process.env.WIDTHS || '360,1280').split(',').map(Number);
const CANDIDATES = {
  chrome: [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ],
  edge: [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/microsoft-edge',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  firefox: [
    'C:/Program Files/Mozilla Firefox/firefox.exe',
    '/usr/bin/firefox',
    '/Applications/Firefox.app/Contents/MacOS/firefox',
  ],
};
// Chemin d'un navigateur : d'abord la variable CHROME_PATH, EDGE_PATH ou FIREFOX_PATH si elle
// existe, sinon le premier emplacement habituel qui existe sur l'ordinateur.
const findPath = (name) =>
  [process.env[`${name.toUpperCase()}_PATH`], ...(CANDIDATES[name] ?? [])].find(
    (p) => p && fs.existsSync(p),
  );
const browsers = (process.env.BROWSERS || 'chrome,edge,firefox')
  .split(',')
  .map((name) => ({ name, path: findPath(name) }));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Le parcours, étape par étape. Chaque étape lève une erreur si quelque chose ne va pas.
async function journey(page, width) {
  const mobile = width < 900;
  const steps = [];
  const step = async (name, fn) => {
    await fn();
    steps.push(name);
  };
  const text = (sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, ' ').trim());
  // Ouvre le menu burger si besoin, puis clique sur un élément de la barre de navigation.
  const navClick = async (selector) => {
    if (mobile) {
      const open = await page.$eval('.nav__burger', (b) => b.getAttribute('aria-expanded'));
      if (open !== 'true') await page.click('.nav__burger');
    }
    await page.click(selector);
    await wait(400);
  };
  // Attend la nouvelle page, puis la fin du fondu entre les pages (View Transitions) :
  // pendant ces 0,2 s, le navigateur ignore les clics.
  const expectPath = async (path) => {
    await page.waitForFunction((p) => location.pathname === p, { timeout: 5000 }, path);
    await wait(400);
  };
  const login = async (index, path) => {
    await navClick('.nav a[href="/login"]');
    await expectPath('/login');
    await (await page.$$('.demo__item'))[index].click();
    await page.click('form button[type=submit]');
    await expectPath(path);
    await wait(600);
  };

  await step('accueil', async () => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    if (!(await text('h1')).startsWith('Sache ce que tu maîtrises')) throw new Error('titre');
  });
  await step('connexion démo (Amira)', () => login(0, '/dashboard'));
  await step('tableau de bord', async () => {
    if (!(await text('h1')).includes('Amira')) throw new Error('bonjour Amira absent');
    if ((await page.$$('.concept')).length !== 8) throw new Error('8 concepts attendus');
  });
  await step('quiz (3 questions)', async () => {
    await page.click('.concept a[href="/quiz/linecodes"]');
    await expectPath('/quiz/linecodes');
    await page.waitForSelector('.choice', { timeout: 5000 });
    for (let i = 0; i < 10 && !(await page.$('.quiz--done')); i++) {
      await page.click('.choice');
      await page.waitForSelector('.feedback button', { timeout: 5000 });
      await page.click('.feedback button');
      await wait(200);
    }
    if (!(await text('.quiz--done h2')).startsWith('Quiz terminé')) throw new Error('fin du quiz');
  });
  await step('profil (mise à jour)', async () => {
    await navClick('.nav a[href="/profile"]');
    await expectPath('/profile');
    await page.$eval('input[formcontrolname=name]', (e) => (e.value = ''));
    await page.type('input[formcontrolname=name]', 'Amira B.');
    await page.click('form button[type=submit]');
    await page.waitForSelector('.alert--success', { timeout: 5000 });
    if (!(await text('.nav .chip--link')).startsWith('Amira B.'))
      throw new Error('nom non mis à jour');
  });
  await step('déconnexion', async () => {
    if (mobile) await page.click('.nav__burger');
    await page.click('.nav__user .btn--ghost');
    await expectPath('/');
  });
  await step('connexion enseignant', () => login(2, '/teacher'));
  await step('carte de chaleur', async () => {
    await page.waitForSelector('table.heatmap tbody tr', { timeout: 5000 });
  });
  await step('création d’une question', async () => {
    await navClick('.nav a[href="/teacher/questions"]');
    await expectPath('/teacher/questions');
    await page.waitForSelector('.qlist__item', { timeout: 5000 });
    await page.type(
      'textarea[formcontrolname=text]',
      'Le code Manchester a-t-il une composante continue ?',
    );
    const choices = await page.$$('.choice-row input[type=text]');
    await choices[0].type('Oui');
    await choices[1].type('Non');
    await (await page.$$('.choice-row input[type=radio]'))[1].click();
    await page.type(
      'textarea[formcontrolname=explanation]',
      'Chaque bit contient une transition : moyenne nulle.',
    );
    await page.click('.editor__form button[type=submit]');
    await page.waitForSelector('.editor__form .alert--success', { timeout: 5000 });
  });
  return steps;
}

let failures = 0;
const rows = [];
for (const { name, path } of browsers) {
  if (!path) {
    rows.push(`${name.padEnd(7)} | non installé sur cet ordinateur`);
    continue;
  }
  // Chrome et Edge se pilotent avec le même protocole ; Firefox demande de préciser `browser`
  // (puppeteer lui parle alors en WebDriver BiDi, le protocole standard des navigateurs).
  const browser = await puppeteer.launch({
    browser: name === 'firefox' ? 'firefox' : 'chrome',
    executablePath: path,
    headless: true,
  });
  for (const width of WIDTHS) {
    const context = await browser.createBrowserContext(); // une session vierge (comme une navigation privée)
    const page = await context.newPage();
    await page.setViewport({ width, height: 800 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    let result;
    try {
      const steps = await journey(page, width);
      if (errors.length) throw new Error('erreur dans la console : ' + errors[0]);
      result = `OK (${steps.length} étapes)`;
    } catch (err) {
      failures++;
      result = `ÉCHEC : ${err.message}`;
      await page.screenshot({ path: `e2e-echec-${name}-${width}.png`, fullPage: true });
    }
    rows.push(`${name.padEnd(7)} | ${String(width).padStart(4)} px | ${result}`);
    await context.close();
  }
  await browser.close();
}
console.log(rows.join('\n'));
process.exit(failures ? 1 : 0);
