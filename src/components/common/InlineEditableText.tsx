import { useEffect, useRef, useState } from "react";

interface InlineEditableTextProps {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

export function InlineEditableText({
  value,
  onCommit,
  className = "",
  inputClassName = "",
  autoFocus = false,
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(autoFocus);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  // Only the very first edit session — triggered by autoFocus on mount —
  // races against a competing native "click" event (see effect below).
  // Every later double-click-to-edit session has no such race and should
  // focus immediately, or fast successive renames can miss the window.
  const deferNextFocus = useRef(autoFocus);

  useEffect(() => {
    if (!editing) return;
    const shouldDefer = deferNextFocus.current;
    deferNextFocus.current = false;

    if (!shouldDefer) {
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    // Deferred: when editing starts as a direct result of the same click
    // that created the element (new-table autofocus), the browser's
    // native "click" event still hasn't been dispatched to the newly
    // rendered, focusable node wrapper yet — and its default action would
    // steal focus right back. Running after that settles wins the race.
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [editing]);

  function startEditing() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
  }

  function cancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        className={`nodrag nopan ${inputClassName}`}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Double-click to rename"
      onDoubleClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === "Enter") startEditing();
      }}
      className={`cursor-text select-none ${className}`}
    >
      {value}
    </span>
  );
}
