import { describe, expect, it } from "vitest";
import raw from "../../public/questions.json";
import type { RawQuestion } from "../types";
import { correctIndices, displayCorrect, grade, normalizeText, optionOrder } from "./grading";
import { buildSession, record, stats } from "./session";
import { questions } from "../data";

const ans = (picked: number[], text = "") => ({ picked, text });

// deterministic rng
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

describe("single answer", () => {
  const q: RawQuestion = { question: "x", answers: ["A", "B", "C", "D"], correct: "b" };
  it("accepts the correct original index", () => expect(grade(q, ans([1]))).toBe(true));
  it("rejects others", () => {
    expect(grade(q, ans([0]))).toBe(false);
    expect(grade(q, ans([1, 2]))).toBe(false);
    expect(grade(q, ans([]))).toBe(false);
  });
});

describe("multi answer with shuffled options", () => {
  const q: RawQuestion = { question: "x", answers: ["A", "B", "C", "D", "E"], correct: "bd" };
  it("needs exactly the correct set, any order", () => {
    expect(correctIndices(q)).toEqual([1, 3]);
    expect(grade(q, ans([3, 1]))).toBe(true);
    expect(grade(q, ans([1]))).toBe(false);
    expect(grade(q, ans([1, 3, 4]))).toBe(false);
  });
  it("grades by original index whatever the display order", () => {
    for (let s = 1; s < 50; s++) {
      const order = optionOrder(q, rng(s));
      expect([...order].sort()).toEqual([0, 1, 2, 3, 4]);
      // user clicks the display positions showing "B" and "D"
      const clicked = order.map((orig, pos) => (q.answers[orig] === "B" || q.answers[orig] === "D" ? pos : -1)).filter((p) => p >= 0);
      expect(grade(q, ans(clicked.map((p) => order[p])))).toBe(true);
      // displayed letters point at B and D
      const shown = displayCorrect(q, order).split("").map((l) => q.answers[order[l.charCodeAt(0) - 97]]);
      expect(shown.sort()).toEqual(["B", "D"]);
    }
  });
  it("actually shuffles", () => {
    const seen = new Set<string>();
    for (let s = 1; s < 30; s++) seen.add(optionOrder(q, rng(s)).join(""));
    expect(seen.size).toBeGreaterThan(5);
  });
  it("keeps true/false and 'all of the above' in place", () => {
    expect(optionOrder({ question: "", answers: ["true", "false"], correct: "a" }, rng(3))).toEqual([0, 1]);
    const q2 = { question: "", answers: ["x", "y", "z", "All of the above"], correct: "d" };
    for (let s = 1; s < 20; s++) expect(optionOrder(q2, rng(s))[3]).toBe(3);
  });
});

describe("free text", () => {
  const q: RawQuestion = { question: "x", answers: [], correct: "10.0.0.1,192.168.3.1,192.168.1.254,10.0.0.1" };
  it("normalizes spaces, case and commas", () => {
    expect(grade(q, ans([], "10.0.0.1, 192.168.3.1, 192.168.1.254, 10.0.0.1"))).toBe(true);
    expect(grade(q, ans([], "  10.0.0.1 ,192.168.3.1 ,  192.168.1.254,10.0.0.1  "))).toBe(true);
    expect(grade(q, ans([], "10.0.0.1,192.168.3.1,192.168.1.254"))).toBe(false);
    expect(normalizeText("  180.176.0.0 / 255.240.0.0 ")).toBe("180.176.0.0/255.240.0.0");
    expect(normalizeText("Hello   World")).toBe("hello world");
  });
});

describe("dataset", () => {
  it("has valid correct letters and unique ids", () => {
    for (const q of raw as RawQuestion[]) {
      if (q.answers.length) expect(correctIndices(q).length, q.question).toBe(q.correct.trim().length);
      else expect(q.correct.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });
});

describe("sessions and progress", () => {
  it("builds exam of N and tracks mistakes", () => {
    const s = buildSession("exam", questions, {}, { size: 30, minutes: 0 }, rng(7))!;
    expect(s.items.length).toBe(30);
    expect(new Set(s.items.map((i) => i.qid)).size).toBe(30);
    let p = record({}, questions[0].id, false);
    expect(stats(questions, p).mistakes).toBe(1);
    expect(buildSession("mistakes", questions, p, { size: 30, minutes: 0 })!.items.length).toBe(1);
    p = record(p, questions[0].id, true);
    p = record(p, questions[0].id, true);
    expect(stats(questions, p)).toMatchObject({ answered: 1, mastered: 1, mistakes: 0 });
    expect(buildSession("mistakes", questions, p, { size: 30, minutes: 0 })).toBeNull();
    expect(buildSession("unseen", questions, p, { size: 30, minutes: 0 })!.items.length).toBe(questions.length - 1);
  });
});
