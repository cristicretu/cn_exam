import { useState } from "react";
import { Dialog } from "./Dialog";

export type Theme = "system" | "light" | "dark";

interface Props {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
  onReset: () => void;
}

export function Settings({ open, onClose, theme, setTheme, apiKey, setApiKey, onReset }: Props) {
  const [show, setShow] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title="settings">
      <div className="field">
        <label id="theme-l">theme</label>
        <div className="seg" role="group" aria-labelledby="theme-l">
          {(["system", "light", "dark"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="gkey">Gemini API key (optional, enables "explain")</label>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input
            id="gkey"
            type={show ? "text" : "password"}
            value={apiKey}
            placeholder="AIza..."
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setApiKey(e.target.value.trim())}
          />
          <button type="button" onClick={() => setShow((v) => !v)}>
            {show ? "hide" : "show"}
          </button>
        </div>
        <p className="dim small" style={{ marginTop: 8 }}>
          Stored only in this browser (localStorage). It never leaves your browser except in requests to Google's
          Gemini API, sent only when you click explain. Get a free key at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com
          </a>
          .
        </p>
        {apiKey && (
          <button type="button" className="link" onClick={() => setApiKey("")}>
            remove key
          </button>
        )}
      </div>

      <div className="field">
        <label>progress</label>
        <p className="dim small">Per-question history is kept in this browser only.</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all progress and the current session? This cannot be undone.")) onReset();
          }}
        >
          reset progress
        </button>
      </div>
    </Dialog>
  );
}
