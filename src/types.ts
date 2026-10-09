export interface RawQuestion {
  question: string;
  /** Options. Empty for free-text questions. */
  answers: string[];
  /** Letters of the correct options ("a", "bc") or the expected text when `answers` is empty. */
  correct: string;
  image?: string;
  correction?: string;
}

export interface Question extends RawQuestion {
  /** Stable id derived from the question text and options. */
  id: string;
  /** 1-based position in public/questions.json. */
  n: number;
}

export type Mode = "practice" | "exam" | "mistakes" | "unseen";

export interface Item {
  qid: string;
  /** Original option indices in display order. */
  order: number[];
}

export interface Answer {
  /** Original option indices (never display positions). */
  picked: number[];
  text: string;
  /** Locked answers can no longer change. Practice locks on submit, exam on finish. */
  locked: boolean;
}

export interface Session {
  v: 1;
  mode: Mode;
  items: Item[];
  answers: Record<number, Answer>;
  pos: number;
  elapsedMs: number;
  timeLimitMs: number | null;
  finished: boolean;
}

export interface QuestionProgress {
  seen: number;
  right: number;
  /** Consecutive correct answers. */
  streak: number;
  /** Result of the last answer: 1 right, 0 wrong. */
  last: 0 | 1;
  at: number;
}

export type Progress = Record<string, QuestionProgress>;
