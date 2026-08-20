import { useEffect } from "react";
import { X } from "lucide-react";
import { SHORTCUT_REGISTRY } from "../../lib/shortcutRegistry";

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="w-80 rounded-lg border shadow-lg"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2 className="text-[13px] font-medium">Keyboard shortcuts</h2>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="rounded p-0.5 text-[color:var(--color-text-faint)] hover:bg-zinc-100 hover:text-[color:var(--color-text)]"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
        <ul className="max-h-96 overflow-y-auto px-4 py-3">
          {SHORTCUT_REGISTRY.map((entry) => (
            <li
              key={entry.keys}
              className="flex items-center justify-between gap-4 py-1.5 text-[12.5px]"
            >
              <span className="text-[color:var(--color-text-muted)]">{entry.description}</span>
              <kbd
                className="rounded border px-1.5 py-0.5 font-mono text-[11px]"
                style={{ borderColor: "var(--color-border)", background: "var(--color-canvas)" }}
              >
                {entry.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
