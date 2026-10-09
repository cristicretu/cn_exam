import type { Question } from "../types";
import { correctIndices, isFreeText, letter } from "./grading";

const MODEL = "gemini-2.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export function buildPrompt(q: Question, order: number[], picked: number[], text: string): string {
  const lines = [`Computer Networks exam question:`, q.question, ""];
  if (isFreeText(q)) {
    lines.push(`Student answered: ${text.trim() || "(nothing)"}`);
    lines.push(`Expected answer: ${q.correct}`);
  } else {
    const shown = (orig: number) => `${letter(order.indexOf(orig))}) ${q.answers[orig]}`;
    lines.push("Options:");
    order.forEach((orig) => lines.push(shown(orig)));
    lines.push("");
    lines.push(`Student picked: ${picked.length ? picked.map(shown).join("; ") : "(nothing)"}`);
    lines.push(`Correct: ${correctIndices(q).map(shown).join("; ")}`);
  }
  if (q.correction) lines.push(`Note from the dataset: ${q.correction}`);
  lines.push(
    "",
    "Explain briefly (under 150 words) why the correct answer is right and, if the student was wrong, why their pick is wrong.",
    "If you think the marked correct answer is itself wrong, say so plainly. Use plain text or simple markdown.",
  );
  return lines.join("\n");
}

export async function explain(apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(URL, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON error page
  }
  if (!res.ok) {
    const msg = (body as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(msg ? `${res.status}: ${msg}` : `Request failed (${res.status})`);
  }
  const parts =
    (body as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null)?.candidates?.[0]
      ?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}
