// La « base de données » du MVP : un fichier JSON (data/db.json) gardé en mémoire
// et réécrit sur le disque après chaque modification.
//
// Pourquoi un fichier JSON et pas encore MongoDB ? Le projet demande un backend minimal.
// Chaque fonction ci-dessous a la même forme qu'une future requête MongoDB (trouver un
// document, en trouver plusieurs, en créer un, le modifier) : pour passer à MongoDB, on ne
// modifiera que ce fichier, pas les routes.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SEED_DIR = path.join(DATA_DIR, 'seed');

// Les tests utilisent leur propre fichier (variable d'environnement FHEMT_DB_FILE)
// pour ne jamais écraser data/db.json.
const dbFile = () => process.env.FHEMT_DB_FILE || path.join(DATA_DIR, 'db.json');

// Les « collections » de la base (comme les tables en SQL). Une par fichier seed.
const COLLECTIONS = ['concepts', 'questions', 'users', 'mastery', 'messages'];

let db = null; // { concepts, questions, users, mastery, messages, answers }

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

// Un identifiant court et unique : préfixe + date + hasard (ex. « m-mi3k2x-4f1a »).
function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// Construit une base neuve à partir des fichiers seed.
export async function loadSeed() {
  const seed = { answers: [] };
  for (const name of COLLECTIONS) seed[name] = await readJson(path.join(SEED_DIR, `${name}.json`));
  return seed;
}

// Appelée une fois au démarrage : réutilise data/db.json s'il existe, sinon le crée.
export async function initStore() {
  try {
    db = await readJson(dbFile());
  } catch {
    db = await loadSeed();
    await persist();
    console.log('data/db.json créé à partir des fichiers seed.');
    return;
  }
  // Une base créée par une version plus ancienne (objectif 3) n'a pas encore toutes les
  // collections (par exemple « messages ») : on les ajoute sans toucher au reste.
  const seed = await loadSeed();
  let changed = false;
  for (const name of [...COLLECTIONS, 'answers']) {
    if (!Array.isArray(db[name])) {
      db[name] = seed[name];
      changed = true;
    }
  }
  if (changed) await persist();
}

export async function resetStore() {
  db = await loadSeed();
  await persist();
}

async function persist() {
  await fs.writeFile(dbFile(), JSON.stringify(db, null, 2));
}

// ---- Concepts (contenu du cours, en lecture seule) --------------------------
export function getConcepts() {
  return db.concepts;
}
export function getConcept(id) {
  return db.concepts.find((c) => c.id === id) || null;
}

// ---- Questions des quiz (créées et modifiées par les enseignants) -----------
export function getQuestionsForConcept(conceptId) {
  return db.questions.filter((q) => q.conceptId === conceptId);
}
export function getQuestion(id) {
  return db.questions.find((q) => q.id === id) || null;
}
export async function createQuestion(data, authorId) {
  const question = {
    id: newId(`q-${data.conceptId}`),
    ...data, // conceptId, text, choices, correctIndex, explanation (déjà validés)
    createdBy: authorId,
    createdAt: new Date().toISOString(),
  };
  db.questions.push(question);
  await persist();
  return question;
}
export async function updateQuestion(id, data, authorId) {
  const question = getQuestion(id);
  if (!question) return null;
  Object.assign(question, data, { updatedBy: authorId, updatedAt: new Date().toISOString() });
  await persist();
  return question;
}

// ---- Utilisateurs ------------------------------------------------------------
export function getUser(id) {
  return db.users.find((u) => u.id === id) || null;
}
export function getUserByEmail(email) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}
export function getUsersByRole(role) {
  return db.users.filter((u) => u.role === role);
}
export async function createUser({ email, name, role = 'student' }) {
  const user = {
    id: newId('u'),
    email: email.toLowerCase(),
    name,
    role, // le rôle est stocké sur le serveur : on ne fait jamais confiance au client
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await persist();
  return user;
}
// Met à jour le nom et/ou les préférences. Jamais l'e-mail ni le rôle.
export async function updateUser(id, { name, preferences }) {
  const user = getUser(id);
  if (!user) return null;
  if (name !== undefined) user.name = name;
  if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };
  user.updatedAt = new Date().toISOString();
  await persist();
  return user;
}

// ---- Maîtrise : un niveau (0 à 100) par couple (utilisateur, concept) --------
export function getMasteryForUser(userId) {
  const levels = {};
  for (const m of db.mastery) {
    if (m.userId === userId) levels[m.conceptId] = m.level;
  }
  return levels; // { sampling: 60, nyquist: 20, ... } (absent = jamais évalué)
}
export async function setMastery(userId, conceptId, level) {
  const row = db.mastery.find((m) => m.userId === userId && m.conceptId === conceptId);
  if (row) {
    row.level = level;
    row.updatedAt = new Date().toISOString();
  } else {
    db.mastery.push({ userId, conceptId, level, updatedAt: new Date().toISOString() });
  }
  await persist();
}

// ---- Historique des réponses (pour de futures statistiques) ------------------
export async function logAnswer(entry) {
  db.answers.push({ ...entry, at: new Date().toISOString() });
  await persist();
}

// ---- Messages du formulaire de contact ----------------------------------------
export async function createMessage(data) {
  const message = { id: newId('m'), ...data, createdAt: new Date().toISOString() };
  db.messages.push(message);
  await persist();
  return message;
}
export function getMessages() {
  return db.messages;
}
