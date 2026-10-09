import { useCallback, useEffect, useRef } from "react";
import type { Answer, Session } from "../types";
import { byId } from "../data";
import { correctIndices, displayCorrect, grade, hasAnswer, isFreeText } from "../lib/grading";
import { MODES, formatTime } from "../lib/session";
import { issueUrl } from "../lib/issue";
import { QuestionBody } from "./QuestionBody";
import { Explain } from "./Explain";

interface Props {
  session: Session;
  update: (fn: (s: Session) => Session) => void;
  onRecord: (qid: string, correct: boolean) => void;
  onFinish: () => void;
  onHome: () => void;
  apiKey: string;
  header: React.ReactNode;
}

const EMPTY: Answer = { picked: [], text: "", locked: false };
const finePointer = () => typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches;

export function Quiz({ session, update, onRecord, onFinish, onHome, apiKey, header }: Props) {
  const { pos, items, mode } = session;
  const item = items[pos];
  const q = byId.get(item.qid)!;
  const a = session.answers[pos] ?? EMPTY;
  const exam = mode === "exam";
  const reveal = a.locked && !exam;
  const editable = !a.locked && !session.finished;
  const last = pos === items.length - 1;
  const answeredCount = items.reduce((n, it, i) => n + (hasAnswer(byId.get(it.qid)!, session.answers[i]) ? 1 : 0), 0);
  const rootRef = useRef<HTMLDivElement>(null);

  const setAnswer = useCallback(
    (patch: Partial<Answer>) =>
      update((s) => {
        const cur = s.answers[s.pos] ?? EMPTY;
        if (cur.locked) return s;
        return { ...s, answers: { ...s.answers, [s.pos]: { ...cur, ...patch } } };
      }),
    [update],
  );

  const toggle = (orig: number) => {
    if (!editable) return;
    const multi = correctIndices(q).length > 1;
    const picked = multi
      ? a.picked.includes(orig)
        ? a.picked.filter((x) => x !== orig)
        : [...a.picked, orig]
      : [orig];
    setAnswer({ picked });
  };

  const go = (to: number) => update((s) => ({ ...s, pos: Math.min(Math.max(0, to), s.items.length - 1) }));

  const finish = () => {
    if (exam) {
      const left = items.length - answeredCount;
      if (left > 0 && !window.confirm(`${left} unanswered. Finish the exam anyway?`)) return;
    } else {
      const pending = items.length - Object.values(session.answers).filter((x) => x.locked).length;
      if (pending > 0 && !window.confirm(`End now? ${pending} questions left; results show what you answered.`)) return;
    }
    onFinish();
  };

  const submit = () => {
    if (!editable || !hasAnswer(q, a)) return;
    update((s) => ({ ...s, answers: { ...s.answers, [s.pos]: { ...a, locked: true } } }));
    onRecord(q.id, grade(q, a));
  };

  const primary = () => {
    if (exam) {
      if (last) finish();
      else go(pos + 1);
      return;
    }
    if (editable) submit();
    else if (last) onFinish();
    else go(pos + 1);
  };

  // move focus to the question when it changes, so keys and screen readers start there
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isFreeText(q) || !editable || !finePointer()) rootRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  // keyboard
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const t = e.target as HTMLElement;
    const inField = t.tagName === "INPUT" || t.tagName === "TEXTAREA";
    if (inField) return; // the text field handles its own Enter via the form
    const optButtons = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-opt]") ?? []);

    if (e.key === "Enter") {
      // let Enter activate other focused buttons/links normally
      if ((t.tagName === "BUTTON" && !t.hasAttribute("data-opt")) || t.tagName === "A") return;
      e.preventDefault();
      primary();
    } else if (/^[1-9]$/.test(e.key)) {
      const p = Number(e.key) - 1;
      if (p < item.order.length) {
        e.preventDefault();
        toggle(item.order[p]);
        optButtons[p]?.focus();
      }
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!optButtons.length) return;
      e.preventDefault();
      const cur = optButtons.indexOf(document.activeElement as HTMLButtonElement);
      const n = optButtons.length;
      const next = cur < 0 ? (e.key === "ArrowDown" ? 0 : n - 1) : (cur + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      optButtons[next].focus();
    } else if (e.key === "ArrowLeft") {
      if (pos > 0) {
        e.preventDefault();
        go(pos - 1);
      }
    } else if (e.key === "ArrowRight") {
      if (!last) {
        e.preventDefault();
        go(pos + 1);
      }
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const right = reveal && grade(q, a);
  const remaining = session.timeLimitMs != null ? session.timeLimitMs - session.elapsedMs : null;

  let primaryLabel: string;
  if (exam) primaryLabel = last ? "finish" : "next";
  else if (editable) primaryLabel = "submit";
  else primaryLabel = last ? "results" : "next";

  return (
    <main>
      {header}
      <div className="meter" aria-hidden>
        <div style={{ width: `${((exam ? answeredCount : pos + (a.locked ? 1 : 0)) / items.length) * 100}%` }} />
      </div>
      <div ref={rootRef} tabIndex={-1} style={{ outline: "none" }}>
        <div className="qhead">
          <span>
            {MODES[mode].label.toLowerCase()} {pos + 1}/{items.length}
          </span>
          {exam && <span>answered {answeredCount}</span>}
          <span className={remaining != null && remaining < 60_000 ? "bad" : undefined}>
            {remaining != null ? `${formatTime(remaining)} left` : formatTime(session.elapsedMs)}
          </span>
          <span className="spacer" />
          <span>#{q.n}</span>
        </div>

        <QuestionBody
          key={pos}
          q={q}
          order={item.order}
          picked={a.picked}
          text={a.text}
          reveal={reveal}
          editable={editable}
          onToggle={toggle}
          onText={(text) => setAnswer({ text })}
          onEnter={primary}
          autoFocusText={editable && finePointer()}
          freeReveal={false}
        />

        {reveal && (
          <div className={`feedback ${right ? "ok" : "bad"}`} role="status">
            <p className="label">
              {right ? (
                <span className="ok">correct</span>
              ) : (
                <>
                  <span className="bad">wrong.</span>{" "}
                  {!isFreeText(q) && <span>answer: {displayCorrect(q, item.order).split("").join(", ")}</span>}
                </>
              )}
            </p>
            {isFreeText(q) && (
              <>
                <p>
                  <span className="dim">your answer: </span>
                  {a.text.trim()}
                </p>
                {!right && (
                  <p>
                    <span className="dim">correct: </span>
                    <span className="ok">{q.correct}</span>
                  </p>
                )}
              </>
            )}
            {q.correction && <p className="dim">{q.correction}</p>}
          </div>
        )}

        <div className="actions">
          <button type="button" onClick={() => go(pos - 1)} disabled={pos === 0}>
            prev
          </button>
          <button
            type="button"
            className="primary"
            onClick={primary}
            disabled={!exam && editable && !hasAnswer(q, a)}
          >
            {primaryLabel} <kbd className="hide-sm">enter</kbd>
          </button>
          {!exam && editable && !last && (
            <button type="button" onClick={() => go(pos + 1)}>
              skip
            </button>
          )}
          <span className="spacer" />
          {reveal && <Explain key={`${pos}:${q.id}`} q={q} order={item.order} picked={a.picked} text={a.text} apiKey={apiKey} />}
        </div>

        <div className="row small">
          <a href={issueUrl(q)} target="_blank" rel="noreferrer">
            wrong answer in the dataset?
          </a>
          <span className="spacer" />
          <button type="button" className="link" onClick={finish}>
            {exam ? "finish exam" : "end session"}
          </button>
          <button type="button" className="link" onClick={onHome}>
            home
          </button>
        </div>
      </div>
    </main>
  );
}
