// La forme des données échangées avec le backend (voir backend/src/routes).
// Des interfaces TypeScript : elles décrivent seulement des objets, elles ne produisent aucun code.

export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
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
