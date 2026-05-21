export type QuizType = 'multiple-choice' | 'fill-blank' | 'matching';
export type Direction = 'de-en' | 'en-de';
export type QuizStatus = 'in-progress' | 'completed';

export interface SavedMCQ {
  type: 'multiple-choice';
  vocabId: string; vocabGerman: string; vocabEnglish: string; vocabWordType: string; nounArticle?: string;
  options: string[]; correctAnswer: string;
}
export interface SavedFillQ {
  type: 'fill-blank';
  vocabId: string; vocabGerman: string; vocabWordType: string;
  sentence: string; fullSentence: string; correctAnswer: string;
}
export interface SavedMatchQ {
  type: 'matching';
  pairs: Array<{ id: string; german: string; english: string }>;
  leftOrder: string[];
  rightOrder: string[];
}
export type SavedQuestion = SavedMCQ | SavedFillQ | SavedMatchQ;

export interface QuizSet {
  _id: string;
  quizType: QuizType;
  direction: Direction;
  totalQuestions: number;
  questionsAnswered: number;
  score: number;
  status: QuizStatus;
  createdAt: string;
  completedAt?: string;
  savedQuestions?: SavedQuestion[];
  currentIndex?: number;
}
