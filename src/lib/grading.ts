import type { Answer, RawQuestion } from "../types";

export const letter = (i: number) => String.fromCharCode(97 + i);

export const isFreeText = (q: RawQuestion) => q.answers.length === 0;

/** Original indices of the correct options. */
export function correctIndices(q: RawQuestion): number[] {
  if (isFreeText(q)) return [];
  const out = new Set<number>();
  for (const ch of q.correct.trim().toLowerCase()) {
    const i = ch.charCodeAt(0) - 97;
    if (i >= 0 && i < q.answers.length) out.add(i);
  }
  return [...out].sort((a, b) => a - b);
}

/** Lowercase, trim, collapse whitespace, drop spaces around , / ; */
export function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*([,/;])\s*/g, "$1");
}

export function hasAnswer(q: RawQuestion, a: Pick<Answer, "picked" | "text"> | undefined): boolean {
  if (!a) return false;
  return isFreeText(q) ? a.text.trim() !== "" : a.picked.length > 0;
}

/** `picked` holds original option indices, so shuffling the display never changes the result. */
export function grade(q: RawQuestion, a: Pick<Answer, "picked" | "text"> | undefined): boolean {
  if (!a) return false;
  if (isFreeText(q)) return normalizeText(a.text) === normalizeText(q.correct);
  const want = correctIndices(q);
  const got = [...new Set(a.picked)].sort((x, y) => x - y);
  return want.length === got.length && want.every((v, i) => v === got[i]);
}

const PINNED = /^(all|none|both)\b.*\b(above|choices|combinations|answers)\b/i;
const TRUE_FALSE = /^(true|false)$/i;

/**
 * Display order for a question's options, as original indices.
 * True/false stays in order; "all/none of the above" style options keep their slot.
 */
export function optionOrder(q: RawQuestion, rand: () => number = Math.random): number[] {
  const idx = q.answers.map((_, i) => i);
  if (idx.length < 2 || q.answers.every((a) => TRUE_FALSE.test(a.trim()))) return idx;
  const free = idx.filter((i) => !PINNED.test(q.answers[i].trim()));
  const shuffled = shuffle(free, rand);
  let k = 0;
  return idx.map((i) => (PINNED.test(q.answers[i].trim()) ? i : shuffled[k++]));
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Correct answer in the letters the user saw (display order). */
export function displayCorrect(q: RawQuestion, order: number[]): string {
  if (isFreeText(q)) return q.correct;
  const set = new Set(correctIndices(q));
  return order
    .map((orig, pos) => (set.has(orig) ? letter(pos) : ""))
    .join("");
}
