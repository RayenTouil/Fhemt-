// La « base de données » du MVP : un fichier JSON (data/db.json) gardé en mémoire
// et réécrit sur le disque après chaque modification.
//
// Pourquoi un fichier JSON et pas encore MongoDB ? L'objectif 3 demande un backend
// minimal. Chaque fonction ci-dessous a la même forme qu'une future requête MongoDB
// (trouver un document, en trouver plusieurs, enregistrer) : pour passer à MongoDB,
// on ne modifiera que ce fichier, pas les routes.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SEED_DIR = path.join(DATA_DIR, 'seed');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let db = null; // { concepts, questions, users, mastery, answers }

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

// Construit une base neuve à partir des fichiers seed.
export async function loadSeed() {
  return {
    concepts: await readJson(path.join(SEED_DIR, 'concepts.json')),
    questions: await readJson(path.join(SEED_DIR, 'questions.json')),
    users: await readJson(path.join(SEED_DIR, 'users.json')),
    mastery: await readJson(path.join(SEED_DIR, 'mastery.json')),
    answers: [],
  };
}

// Appelée une fois au démarrage : réutilise data/db.json s'il existe, sinon le crée.
export async function initStore() {
  try {
    db = await readJson(DB_FILE);
  } catch {
    db = await loadSeed();
    await persist();
    console.log('data/db.json créé à partir des fichiers seed.');
  }
}

export async function resetStore() {
  db = await loadSeed();
  await persist();
}

async function persist() {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

// ---- Concepts et questions (contenu en lecture seule) ----------------------
export function getConcepts() {
  return db.concepts;
}
export function getConcept(id) {
  return db.concepts.find((c) => c.id === id) || null;
}
export function getQuestionsForConcept(conceptId) {
  return db.questions.filter((q) => q.conceptId === conceptId);
}
export function getQuestion(id) {
  return db.questions.find((q) => q.id === id) || null;
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
    id: 'u' + Date.now().toString(36),
    email: email.toLowerCase(),
    name,
    role, // le rôle est stocké sur le serveur : on ne fait jamais confiance au client
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
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

// ---- Historique des réponses (utile plus tard pour les statistiques) --------
export async function logAnswer(entry) {
  db.answers.push({ ...entry, at: new Date().toISOString() });
  await persist();
}
export function getAnswersForUser(userId) {
  return db.answers.filter((a) => a.userId === userId);
}
