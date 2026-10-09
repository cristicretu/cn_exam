import raw from "../public/questions.json";
import type { Question, RawQuestion } from "./types";

/** FNV-1a, 32 bit. Good enough to key ~700 questions. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function build(list: RawQuestion[]): Question[] {
  const used = new Set<string>();
  return list.map((q, i) => {
    let id = hash(q.question.trim() + "\u0000" + q.answers.join("\u0001"));
    while (used.has(id)) id += "x";
    used.add(id);
    return { ...q, id, n: i + 1 };
  });
}

export const questions: Question[] = build(raw as RawQuestion[]);
export const byId: Map<string, Question> = new Map(questions.map((q) => [q.id, q]));
