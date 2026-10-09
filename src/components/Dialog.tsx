import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Extra buttons in the header, left of "close". */
  head?: ReactNode;
}

/** Native <dialog>: focus trap and Esc come from the browser. */
export function Dialog({ open, title, onClose, children, head }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="dlg">
          <div className="dlg-head">
            <h2>{title}</h2>
            {head}
            <button type="button" onClick={onClose} aria-label="Close">
              esc
            </button>
          </div>
          <div className="dlg-body">{children}</div>
        </div>
      )}
    </dialog>
  );
}
