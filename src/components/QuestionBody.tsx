import type { Question } from "../types";
import { correctIndices, grade, isFreeText, letter } from "../lib/grading";

interface Props {
  q: Question;
  order: number[];
  picked: number[];
  text: string;
  /** Show correct/wrong marks. */
  reveal: boolean;
  /** Options are clickable and the text box is editable. */
  editable: boolean;
  onToggle?: (orig: number) => void;
  onText?: (text: string) => void;
  onEnter?: () => void;
  /** When false, the user's picks are not shown (search peek). */
  showPicks?: boolean;
  autoFocusText?: boolean;
  /** Show 'your answer / correct' lines for free-text questions when revealed. */
  freeReveal?: boolean;
}

function pickHint(q: Question): string {
  if (isFreeText(q)) return "type the answer";
  const n = correctIndices(q).length;
  return n > 1 ? `pick ${n}` : "pick 1";
}

export function QuestionBody({
  q,
  order,
  picked,
  text,
  reveal,
  editable,
  onToggle,
  onText,
  onEnter,
  showPicks = true,
  autoFocusText,
  freeReveal = true,
}: Props) {
  const correct = new Set(correctIndices(q));
  const multi = correct.size > 1;
  const free = isFreeText(q);

  return (
    <>
      <p className="qtext">{q.question}</p>
      {q.image && (
        <a href={q.image} target="_blank" rel="noreferrer">
          <img className="qimg" src={q.image} alt="Diagram for this question" />
        </a>
      )}
      {!free && (
        <>
          <p className="hint">{pickHint(q)}</p>
          <ul className="opts" role={multi ? "group" : "radiogroup"} aria-label="Options">
            {order.map((orig, pos) => {
              const isPicked = showPicks && picked.includes(orig);
              const isRight = correct.has(orig);
              let cls = "opt";
              let tag = "";
              if (reveal) {
                if (isRight) {
                  cls += " is-ok";
                  tag = isPicked ? "correct, your pick" : "correct";
                } else if (isPicked) {
                  cls += " is-bad";
                  tag = "your pick";
                }
              }
              const mark = multi ? (isPicked ? "[x]" : "[ ]") : isPicked ? "(*)" : "( )";
              return (
                <li key={orig}>
                  <button
                    type="button"
                    className={cls}
                    data-opt={pos}
                    role={multi ? "checkbox" : "radio"}
                    aria-checked={isPicked}
                    disabled={!editable}
                    onClick={() => onToggle?.(orig)}
                  >
                    <span className="mark" aria-hidden>
                      {mark}
                    </span>
                    <span className="letter">{letter(pos)}.</span>
                    <span>{q.answers[orig]}</span>
                    <span className="tag">{tag}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {free && (editable || (showPicks && !reveal)) && (
        <form
          className="textans"
          onSubmit={(e) => {
            e.preventDefault();
            onEnter?.();
          }}
        >
          <span className="prompt" aria-hidden>
            &gt;
          </span>
          <input
            type="text"
            aria-label="Your answer"
            value={text}
            readOnly={!editable}
            autoFocus={autoFocusText}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => onText?.(e.target.value)}
            placeholder={pickHint(q)}
          />
        </form>
      )}
      {free && reveal && freeReveal && (
        <div className="feedback">
          {showPicks && (
            <p>
              <span className="dim">your answer: </span>
              <span className={grade(q, { picked: [], text }) ? "ok" : "bad"}>{text.trim() || "(empty)"}</span>
            </p>
          )}
          <p>
            <span className="dim">correct: </span>
            <span className="ok">{q.correct}</span>
          </p>
        </div>
      )}
    </>
  );
}
