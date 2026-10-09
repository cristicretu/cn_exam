import { useEffect, useMemo, useRef, useState } from "react";
import type { Progress, Question } from "../types";
import { questions } from "../data";
import { issueUrl } from "../lib/issue";
import { Dialog } from "./Dialog";
import { QuestionBody } from "./QuestionBody";

interface Props {
  open: boolean;
  onClose: () => void;
  progress: Progress;
}

const LIMIT = 60;

function matches(q: Question, needle: string): boolean {
  if (!needle) return true;
  const words = needle.split(" ");
  const hay = (q.question + " " + q.answers.join(" ") + " " + (q.answers.length ? "" : q.correct)).toLowerCase();
  return words.every((w) => hay.includes(w));
}

export function Search({ open, onClose, progress }: Props) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [peek, setPeek] = useState<Question | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSel(0);
      setPeek(null);
    }
  }, [open]);

  const found = useMemo(() => {
    const s = query.trim().toLowerCase().replace(/\s+/g, " ");
    const num = /^#?(\d+)$/.exec(s);
    if (num) {
      const q = questions[Number(num[1]) - 1];
      const rest = questions.filter((x) => x !== q && matches(x, s));
      return q ? [q, ...rest] : rest;
    }
    return questions.filter((q) => matches(q, s));
  }, [query]);

  useEffect(() => setSel(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(".on")?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const onKey = (e: React.KeyboardEvent) => {
    const n = Math.min(found.length, LIMIT);
    if (!n) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((v) => (v + 1) % n);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((v) => (v - 1 + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      setPeek(found[sel] ?? null);
    }
  };

  const p = peek ? progress[peek.id] : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={peek ? `question #${peek.n}` : "search"}
      head={
        peek && (
          <button type="button" onClick={() => setPeek(null)}>
            back
          </button>
        )
      }
    >
      {peek ? (
        <>
          <QuestionBody
            q={peek}
            order={peek.answers.map((_, i) => i)}
            picked={[]}
            text=""
            reveal
            editable={false}
            showPicks={false}
          />
          {peek.correction && <p className="dim">{peek.correction}</p>}
          <p className="dim small">
            {p ? `seen ${p.seen}x, right ${p.right}x, last ${p.last ? "right" : "wrong"}` : "not answered yet"}
          </p>
          <a className="small" href={issueUrl(peek)} target="_blank" rel="noreferrer">
            wrong answer in the dataset?
          </a>
        </>
      ) : (
        <>
          <input
            type="search"
            autoFocus
            placeholder="words or #number"
            aria-label="Search questions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <p className="dim small">
            {found.length} match{found.length === 1 ? "" : "es"}
            {found.length > LIMIT && `, showing ${LIMIT}`}
          </p>
          <ul className="results" ref={listRef}>
            {found.slice(0, LIMIT).map((q, i) => (
              <li key={q.id}>
                <button type="button" className={i === sel ? "on" : undefined} onClick={() => setPeek(q)} onMouseMove={() => setSel(i)}>
                  <span className="num">#{q.n}</span>
                  <span>{q.question}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}
