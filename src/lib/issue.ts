import type { Question } from "../types";
import { correctIndices, isFreeText, letter } from "./grading";

const REPO = "https://github.com/cristicretu/cn_exam/issues/new";

export function issueUrl(q: Question): string {
  const marked = isFreeText(q)
    ? q.correct
    : correctIndices(q)
        .map((i) => `${letter(i)}) ${q.answers[i]}`)
        .join("\n");
  const options = q.answers.map((a, i) => `${letter(i)}) ${a}`).join("\n");
  const body = [
    `Question #${q.n} in public/questions.json`,
    "",
    "> " + q.question,
    "",
    ...(options ? ["Options (original order):", "```", options, "```", ""] : []),
    "Currently marked correct:",
    "```",
    marked,
    "```",
    "",
    "What I think is correct, and why:",
    "",
  ].join("\n");
  const title = `Wrong answer: #${q.n} ${q.question.slice(0, 60)}${q.question.length > 60 ? "..." : ""}`;
  return `${REPO}?${new URLSearchParams({ title, body }).toString()}`;
}
