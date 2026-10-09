import { useState } from "react";
import type { Mode, Session } from "../types";
import { byId } from "../data";
import { MODES, formatTime, results } from "../lib/session";
import { issueUrl } from "../lib/issue";
import { QuestionBody } from "./QuestionBody";
import { Explain } from "./Explain";

interface Props {
  session: Session;
  mistakesLeft: number;
  onStart: (mode: Mode) => void;
  onHome: () => void;
  apiKey: string;
  header: React.ReactNode;
}

export function EndScreen({ session, mistakesLeft, onStart, onHome, apiKey, header }: Props) {
  const [showAll, setShowAll] = useState(false);
  const exam = session.mode === "exam";
  const all = results(session, byId);
  const answered = all.filter((r) => r.answered);
  const right = all.filter((r) => r.correct).length;
  const base = exam ? all.length : answered.length;
  const pct = base ? Math.round((right / base) * 100) : 0;
  const skipped = all.length - answered.length;
  const shown = all.filter((r) => (showAll ? r.answered || exam : exam ? !r.correct : r.answered && !r.correct));

  return (
    <main>
      {header}
      <p className="dim">{MODES[session.mode].label.toLowerCase()} finished</p>
      <p className="score">
        {right}/{base} <span className="dim">{pct}%</span>
      </p>
      <p className="dim">
        time {formatTime(session.elapsedMs)}
        {skipped > 0 && ` · ${skipped} ${exam ? "unanswered (counted wrong)" : "not answered"}`}
      </p>

      <div className="actions">
        <button type="button" className="primary" onClick={() => onStart(session.mode)}>
          new {MODES[session.mode].label.toLowerCase()}
        </button>
        {mistakesLeft > 0 && (
          <button type="button" onClick={() => onStart("mistakes")}>
            drill mistakes ({mistakesLeft})
          </button>
        )}
        <button type="button" onClick={onHome}>
          home
        </button>
      </div>

      <h2 className="row">
        <span>
          {showAll ? "all answers" : exam ? "wrong or unanswered" : "wrong"} ({shown.length})
        </span>
        <span className="spacer" />
        <button type="button" className="link" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "only mistakes" : "show all"}
        </button>
      </h2>
      {shown.length === 0 && <p className="dim">Nothing to review.</p>}
      {shown.map((r) => {
        const item = session.items[r.pos];
        const a = session.answers[r.pos] ?? { picked: [], text: "", locked: true };
        const q = r.q;
        return (
          <section className="review" key={r.pos}>
            <div className="qhead">
              <span>
                {r.pos + 1}/{all.length}
              </span>
              <span className={r.correct ? "ok" : "bad"}>{r.correct ? "correct" : r.answered ? "wrong" : "unanswered"}</span>
              <span className="spacer" />
              <span>#{q.n}</span>
            </div>
            <QuestionBody q={q} order={item.order} picked={a.picked} text={a.text} reveal editable={false} />
            {q.correction && <p className="dim">{q.correction}</p>}
            <div className="actions">
              <a className="small" href={issueUrl(q)} target="_blank" rel="noreferrer">
                wrong answer in the dataset?
              </a>
              <span className="spacer" />
              <Explain q={q} order={item.order} picked={a.picked} text={a.text} apiKey={apiKey} />
            </div>
          </section>
        );
      })}
    </main>
  );
}
