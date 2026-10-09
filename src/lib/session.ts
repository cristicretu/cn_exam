import type { Mode, Progress, Question, Session } from "../types";
import { grade, hasAnswer, optionOrder, shuffle } from "./grading";

export const MASTERED_STREAK = 2;

export const MODES: Record<Mode, { label: string; blurb: string }> = {
  practice: { label: "Practice", blurb: "all questions, shuffled, instant feedback" },
  exam: { label: "Exam", blurb: "random set, no feedback until the end" },
  mistakes: { label: "Mistakes", blurb: "wrong last time and not fixed since" },
  unseen: { label: "Unseen", blurb: "never answered" },
};

export function pool(mode: Mode, questions: Question[], progress: Progress): Question[] {
  switch (mode) {
    case "mistakes":
      return questions.filter((q) => progress[q.id]?.last === 0);
    case "unseen":
      return questions.filter((q) => !progress[q.id]);
    default:
      return questions;
  }
}

export function buildSession(
  mode: Mode,
  questions: Question[],
  progress: Progress,
  opts: { size: number; minutes: number },
  rand: () => number = Math.random,
): Session | null {
  let list = shuffle(pool(mode, questions, progress), rand);
  if (mode === "exam") list = list.slice(0, Math.max(1, opts.size));
  if (list.length === 0) return null;
  return {
    v: 1,
    mode,
    items: list.map((q) => ({ qid: q.id, order: optionOrder(q, rand) })),
    answers: {},
    pos: 0,
    elapsedMs: 0,
    timeLimitMs: mode === "exam" && opts.minutes > 0 ? opts.minutes * 60_000 : null,
    finished: false,
  };
}

export function record(progress: Progress, qid: string, correct: boolean, now = Date.now()): Progress {
  const p = progress[qid] ?? { seen: 0, right: 0, streak: 0, last: 0 as const, at: 0 };
  return {
    ...progress,
    [qid]: {
      seen: p.seen + 1,
      right: p.right + (correct ? 1 : 0),
      streak: correct ? p.streak + 1 : 0,
      last: correct ? 1 : 0,
      at: now,
    },
  };
}

export function stats(questions: Question[], progress: Progress) {
  let answered = 0;
  let mastered = 0;
  let mistakes = 0;
  for (const q of questions) {
    const p = progress[q.id];
    if (!p) continue;
    answered++;
    if (p.last === 0) mistakes++;
    else if (p.streak >= MASTERED_STREAK) mastered++;
  }
  return { total: questions.length, answered, mastered, mistakes, unseen: questions.length - answered };
}

export interface Result {
  pos: number;
  q: Question;
  answered: boolean;
  correct: boolean;
}

export function results(session: Session, byId: Map<string, Question>): Result[] {
  const out: Result[] = [];
  session.items.forEach((item, pos) => {
    const q = byId.get(item.qid);
    if (!q) return;
    const a = session.answers[pos];
    out.push({ pos, q, answered: hasAnswer(q, a) && (a?.locked ?? false), correct: !!a?.locked && grade(q, a) });
  });
  return out;
}

/** Drop items whose question no longer exists (dataset edits between visits). */
export function sanitize(session: unknown, byId: Map<string, Question>): Session | null {
  const s = session as Session | null;
  if (!s || s.v !== 1 || !Array.isArray(s.items)) return null;
  const valid = s.items.every((it) => {
    const q = byId.get(it.qid);
    return q && it.order.length === q.answers.length;
  });
  if (!valid || s.items.length === 0) return null;
  return { ...s, pos: Math.min(Math.max(0, s.pos | 0), s.items.length - 1) };
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
