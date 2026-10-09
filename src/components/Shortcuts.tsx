import { Dialog } from "./Dialog";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const SHORTCUTS: [string, string][] = [
  ["1-9", "toggle option a-i"],
  ["enter", "submit, then next"],
  ["up / down", "move focus between options"],
  ["space", "toggle the focused option"],
  ["left / right", "previous / next question"],
  [isMac ? "cmd k" : "ctrl k", "search questions"],
  ["?", "this sheet"],
  ["esc", "close dialogs"],
];

export function Shortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="keyboard">
      <table className="keys">
        <tbody>
          {SHORTCUTS.map(([k, v]) => (
            <tr key={k}>
              <td>
                <kbd>{k}</kbd>
              </td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
