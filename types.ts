export enum Subject {
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  MATH = 'Higher Math',
  BIOLOGY = 'Biology',
  ICT = 'ICT',
  ENGLISH = 'English',
  BENGALI = 'Bengali'
}

export enum Goal {
  GPA_5 = 'GPA 5 in HSC',
  MEDICAL = 'HSC + Medical Admission',
  ENGINEERING = 'HSC + Engineering (BUET) Admission'
}

export interface User {
  id: string;
  name: string;
  emailOrPhone: string;
  classLevel: '11' | '12';
  college: string;
  goal: Goal;
  joinedAt: string;
}

export interface StudySession {
  id: string;
  subject: Subject | string;
  topic?: string;
  durationMinutes: number;
  date: string; // ISO string
  notes?: string;
}

export interface RoutineItem {
  day: string;
  timeSlot: string;
  subject: string;
  activity: string; // e.g., "Review Chapter 5", "Solve Math Problems"
}

export interface Routine {
  generatedAt: string;
  items: RoutineItem[];
  goal: string;
}

export interface MockQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
}

export interface MockTestResult {
  subject: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface NoteSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  formulas?: string[];
  potentialQuestions?: { question: string; answer: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachment?: {
    type: 'image' | 'pdf';
    url: string; // Base64 or local URL for preview
    name?: string;
  };
}