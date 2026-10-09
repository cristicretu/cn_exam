import { useCallback, useEffect, useRef, useState } from "react";
import type { Mode, Progress, Session } from "./types";
import { byId, questions } from "./data";
import { KEYS, load, save } from "./lib/storage";
import { buildSession, record, sanitize, stats } from "./lib/session";
import { grade, hasAnswer } from "./lib/grading";
import { Start } from "./components/Start";
import { Quiz } from "./components/Quiz";
import { EndScreen } from "./components/EndScreen";
import { Search } from "./components/Search";
import { Settings, type Theme } from "./components/Settings";
import { Shortcuts } from "./components/Shortcuts";

type Screen = "start" | "quiz";
type Open = null | "search" | "settings" | "keys";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => load(KEYS.progress, {}));
  const [session, setSession] = useState<Session | null>(() => sanitize(load(KEYS.session, null), byId));
  const [screen, setScreen] = useState<Screen>(() => (sanitize(load(KEYS.session, null), byId) ? "quiz" : "start"));
  const [apiKey, setApiKey] = useState<string>(() => load(KEYS.apiKey, ""));
  const [theme, setTheme] = useState<Theme>(() => load(KEYS.theme, "system"));
  const [examSize, setExamSize] = useState<number>(() => load(KEYS.examSize, 30));
  const [examMinutes, setExamMinutes] = useState<number>(() => load(KEYS.examMinutes, 0));
  const [open, setOpen] = useState<Open>(null);

  useEffect(() => save(KEYS.progress, progress), [progress]);
  useEffect(() => save(KEYS.session, session), [session]);
  useEffect(() => save(KEYS.apiKey, apiKey || null), [apiKey]);
  useEffect(() => save(KEYS.examSize, examSize), [examSize]);
  useEffect(() => save(KEYS.examMinutes, examMinutes), [examMinutes]);
  useEffect(() => {
    save(KEYS.theme, theme === "system" ? null : theme);
    const el = document.documentElement;
    if (theme === "system") delete el.dataset.theme;
    else el.dataset.theme = theme;
  }, [theme]);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const finish = useCallback(() => {
    const s = sessionRef.current;
    if (!s || s.finished) return;
    const answers = { ...s.answers };
    if (s.mode === "exam") {
      const results: [string, boolean][] = [];
      s.items.forEach((item, pos) => {
        const q = byId.get(item.qid)!;
        const a = answers[pos];
        if (a && hasAnswer(q, a)) {
          answers[pos] = { ...a, locked: true };
          results.push([q.id, grade(q, a)]);
        }
      });
      setProgress((p) => results.reduce((acc, [id, ok]) => record(acc, id, ok), p));
    }
    setSession({ ...s, answers, finished: true });
    window.scrollTo(0, 0);
  }, []);

  // clock: counts only while the quiz is on screen and the tab is visible
  const active = screen === "quiz" && !!session && !session.finished;
  useEffect(() => {
    if (!active) return;
    let lastTick = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;
      if (document.hidden || delta > 5000) return;
      setSession((s) => (s && !s.finished ? { ...s, elapsedMs: s.elapsedMs + delta } : s));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (session && !session.finished && session.timeLimitMs != null && session.elapsedMs >= session.timeLimitMs) finish();
  }, [session, finish]);

  // global keys
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => (o === "search" ? null : "search"));
        return;
      }
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key === "?" && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        setOpen("keys");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const update = useCallback((fn: (s: Session) => Session) => setSession((s) => (s ? fn(s) : s)), []);

  const start = (mode: Mode) => {
    const cur = sessionRef.current;
    if (cur && !cur.finished && Object.keys(cur.answers).length > 0) {
      if (!window.confirm("Drop the unfinished session and start a new one?")) return;
    }
    const s = buildSession(mode, questions, progress, { size: examSize, minutes: examMinutes });
    if (!s) {
      window.alert("No questions in this mode yet.");
      return;
    }
    setSession(s);
    setScreen("quiz");
  };

  const home = () => {
    if (sessionRef.current?.finished) setSession(null);
    setScreen("start");
    window.scrollTo(0, 0);
  };

  const header = (
    <header className="bar">
      <button type="button" className="title" onClick={home}>
        cn exam
      </button>
      <span className="spacer" />
      <button type="button" onClick={() => setOpen("search")} aria-label="Search questions">
        search <kbd className="hide-sm">{isMac ? "⌘K" : "ctrl K"}</kbd>
      </button>
      <button type="button" onClick={() => setOpen("keys")} aria-label="Keyboard shortcuts">
        ?
      </button>
      <button type="button" onClick={() => setOpen("settings")}>
        settings
      </button>
    </header>
  );

  let body;
  if (screen === "quiz" && session && session.finished) {
    body = (
      <EndScreen
        session={session}
        mistakesLeft={stats(questions, progress).mistakes}
        onStart={start}
        onHome={home}
        apiKey={apiKey}
        header={header}
      />
    );
  } else if (screen === "quiz" && session) {
    body = (
      <Quiz
        session={session}
        update={update}
        onRecord={(qid, ok) => setProgress((p) => record(p, qid, ok))}
        onFinish={finish}
        onHome={home}
        apiKey={apiKey}
        header={header}
      />
    );
  } else {
    body = (
      <Start
        progress={progress}
        session={session}
        examSize={examSize}
        examMinutes={examMinutes}
        setExamSize={setExamSize}
        setExamMinutes={setExamMinutes}
        onStart={start}
        onResume={() => setScreen("quiz")}
        header={header}
        footer={
          <footer>
            <button type="button" className="link" onClick={() => setOpen("keys")}>
              keyboard shortcuts
            </button>
            <a href="https://github.com/cristicretu/cn_exam" target="_blank" rel="noreferrer">
              source and dataset
            </a>
            <a href="https://cristicretu.github.io/ubb" target="_blank" rel="noreferrer">
              ubb notes
            </a>
            <a href="https://ubb-schedule.vercel.app" target="_blank" rel="noreferrer">
              timetable in your calendar
            </a>
          </footer>
        }
      />
    );
  }

  return (
    <>
      {body}
      <Search open={open === "search"} onClose={() => setOpen(null)} progress={progress} />
      <Shortcuts open={open === "keys"} onClose={() => setOpen(null)} />
      <Settings
        open={open === "settings"}
        onClose={() => setOpen(null)}
        theme={theme}
        setTheme={setTheme}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onReset={() => {
          setProgress({});
          setSession(null);
          setScreen("start");
          setOpen(null);
        }}
      />
    </>
  );
}
