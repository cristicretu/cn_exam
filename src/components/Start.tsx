import { useEffect, useState } from "react";
import type { Mode, Progress, Session } from "../types";
import { questions } from "../data";
import { MODES, pool, stats } from "../lib/session";

interface Props {
  progress: Progress;
  session: Session | null;
  examSize: number;
  examMinutes: number;
  setExamSize: (n: number) => void;
  setExamMinutes: (n: number) => void;
  onStart: (mode: Mode) => void;
  onResume: () => void;
  header: React.ReactNode;
  footer: React.ReactNode;
}

const ORDER: Mode[] = ["practice", "exam", "mistakes", "unseen"];

export function Start(props: Props) {
  const { progress, session, examSize, examMinutes, onStart, onResume, header, footer } = props;
  const s = stats(questions, progress);
  const resumable = session && !session.finished;
  const done = session ? Object.values(session.answers).filter((a) => a.locked).length : 0;

  return (
    <main>
      {header}
      <p>
        Practice for the Computer Networks final at UBB. {questions.length} questions from the Moodle exam bank. Some
        marked answers may be wrong; use the report link on a question if you find one.
      </p>

      {resumable && (
        <div className="resume row">
          <span>
            unfinished {MODES[session.mode].label.toLowerCase()}: question {session.pos + 1}/{session.items.length}
            {session.mode !== "exam" && `, ${done} answered`}
          </span>
          <span className="spacer" />
          <button type="button" className="primary" onClick={onResume}>
            resume
          </button>
        </div>
      )}

      <div className="stats" aria-label="Your progress">
        <span>
          answered <b>{s.answered}</b>/{s.total}
        </span>
        <span>
          mastered <b>{s.mastered}</b>
        </span>
        <span>
          mistakes <b className={s.mistakes ? "bad" : undefined}>{s.mistakes}</b>
        </span>
      </div>
      <p className="dim small">mastered = right the last 2 times. mistakes = wrong last time.</p>

      <h2>start</h2>
      <ul className="modes">
        {ORDER.map((m) => {
          const n = m === "exam" ? Math.min(examSize, questions.length) : pool(m, questions, progress).length;
          return (
            <li key={m}>
              <button type="button" className="mode" onClick={() => onStart(m)} disabled={n === 0}>
                <span className="name">{MODES[m].label.toLowerCase()}</span>
                <span className="blurb">{MODES[m].blurb}</span>
                <span className="count">{n}</span>
              </button>
              {m === "exam" && (
                <div className="examopts">
                  <label>
                    questions
                    <NumField value={examSize} min={1} max={questions.length} onCommit={props.setExamSize} />
                  </label>
                  <label>
                    timer (min, 0 = off)
                    <NumField value={examMinutes} min={0} max={300} onCommit={props.setExamMinutes} />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {footer}
    </main>
  );
}

/** Keeps the raw text while typing; commits only valid numbers, snaps back on blur. */
function NumField({ value, min, max, onCommit }: { value: number; min: number; max: number; onCommit: (n: number) => void }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => setRaw(String(value)), [value]);
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        const n = Math.round(Number(e.target.value));
        if (e.target.value !== "" && Number.isFinite(n) && n >= min && n <= max) onCommit(n);
      }}
      onBlur={() => setRaw(String(value))}
    />
  );
}
