// La forme des données échangées avec le backend (voir backend/src/routes).
// Des interfaces TypeScript : elles décrivent seulement des objets, elles ne produisent aucun code.

export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  preferences?: UserPreferences; // absent tant que l'utilisateur n'a rien enregistré
}

// Les préférences modifiables dans la page Profil.
export interface UserPreferences {
  uiMode: 'classique' | 'fiche'; // l'habillage du site
  reduceMotion: boolean; // couper les animations
}

// PATCH /api/users/me : on n'envoie que ce qui change.
export interface ProfileUpdate {
  name?: string;
  preferences?: Partial<UserPreferences>;
}

// POST /api/contact
export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Un concept du cours (GET /api/concepts).
export interface Concept {
  id: string;
  title: string;
  short: string;
  summary: string;
  prerequisites: string[];
  questionCount?: number;
}

// Une question telle que l'enseignant la crée ou la modifie (avec la réponse).
export interface QuestionInput {
  conceptId: string;
  text: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

// Une question complète, vue par l'enseignant (GET /api/teacher/questions).
export interface TeacherQuestion extends QuestionInput {
  id: string;
  createdBy?: string;
  updatedAt?: string;
}

export type MasteryStatus = 'mastered' | 'in-progress' | 'weak' | 'not-assessed';

export interface ConceptMastery {
  id: string;
  title: string;
  short: string;
  summary: string;
  prerequisites: string[];
  level: number | null; // null = jamais évalué
  status: MasteryStatus;
}

export interface MasteryResponse {
  concepts: ConceptMastery[];
  overall: number;
  counts: { mastered: number; inProgress: number; weak: number; notAssessed: number };
  thresholds: { mastered: number; inProgress: number };
}

export interface PathStep {
  conceptId: string;
  title: string;
  level: number | null;
  reason: string;
  kind: 'prerequisite' | 'diagnostic' | 'practice';
}

export interface QuizQuestion {
  id: string;
  text: string;
  choices: string[];
}

export interface QuizResponse {
  concept: { id: string; title: string; short: string; summary: string; prerequisites: string[] };
  questions: QuizQuestion[];
  level: number | null;
}

export interface AnswerResponse {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  mastery: { before: number; after: number; status: MasteryStatus };
}

export interface Heatmap {
  concepts: { id: string; title: string; short: string }[];
  students: { id: string; name: string; levels: Record<string, number> }[];
  averages: Record<string, number | null>; // null = personne n'a encore été évalué
  blockingConcept: { id: string; title: string; average: number } | null;
}
