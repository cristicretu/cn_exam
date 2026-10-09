import { useEffect, useRef, useState } from "react";
import type { Question } from "../types";
import { buildPrompt, explain } from "../lib/gemini";
import { Markdown } from "./Markdown";

interface Props {
  q: Question;
  order: number[];
  picked: number[];
  text: string;
  apiKey: string;
}

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; text: string } | { kind: "error"; message: string };

/** One request per click, for this question only. Mount with a `key` per question. */
export function Explain({ q, order, picked, text, apiKey }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  if (!apiKey) return null;

  const run = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState({ kind: "loading" });
    try {
      const out = await explain(apiKey, buildPrompt(q, order, picked, text), ctrl.signal);
      if (!ctrl.signal.aborted) setState({ kind: "done", text: out });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <>
      {state.kind !== "done" && (
        <button type="button" className="link" onClick={run} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "explaining..." : state.kind === "error" ? "retry explain" : "explain"}
        </button>
      )}
      {state.kind === "error" && <p className="bad small" role="alert" style={{ flexBasis: "100%" }}>Gemini error: {state.message}</p>}
      {state.kind === "done" && (
        <div className="explain" style={{ flexBasis: "100%" }}>
          <p className="dim small">gemini-2.5-flash, can be wrong</p>
          <Markdown text={state.text} />
        </div>
      )}
    </>
  );
}
