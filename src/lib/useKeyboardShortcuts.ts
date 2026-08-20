import { useEffect, useRef } from "react";

export interface ShortcutDef {
  /** Matches KeyboardEvent.key, case-insensitive (e.g. "z", "Delete", "Escape", "?"). */
  key: string;
  /** Ctrl on Windows/Linux, Cmd on Mac — checked as `metaKey || ctrlKey`.
   * Defaults to "must not be pressed" (undefined/false), so single-key
   * shortcuts don't fire on top of unrelated Ctrl+<key> browser actions. */
  mod?: boolean;
  /** true = shift required, false = shift must NOT be held, undefined =
   * don't care. Left undefined for keys like "?" that already require
   * shift to type on most layouts — checking shiftKey too would mean
   * the binding could never match. */
  shift?: boolean;
  /** By default, shortcuts don't fire while focus is in a text field, so
   * typing isn't hijacked. Set true only for keys with no legitimate
   * native meaning in a text field (e.g. Ctrl+S has nothing to do with
   * text editing, so it should still open our Save regardless of focus). */
  allowInEditable?: boolean;
  onTrigger: (e: KeyboardEvent) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
  );
}

/**
 * Registers a set of keyboard shortcuts. Designed so more can be added
 * later without restructuring (masterplan §10) — each caller just passes
 * its own list; multiple components can each own the shortcuts relevant
 * to the state they hold, rather than funneling everything through one
 * giant switch statement.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDef[]): void {
  const shortcutsRef = useRef(shortcuts);

  // Deferred to an effect (runs after every render, no deps) rather than
  // mutated during render — refs are only safe to write outside of
  // rendering itself.
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const editable = isEditableTarget(e.target);
      for (const s of shortcutsRef.current) {
        if (editable && !s.allowInEditable) continue;
        const wantsMod = s.mod ?? false;
        if (wantsMod !== (e.metaKey || e.ctrlKey)) continue;
        if (s.shift !== undefined && s.shift !== e.shiftKey) continue;
        if (e.key.toLowerCase() !== s.key.toLowerCase()) continue;
        e.preventDefault();
        s.onTrigger(e);
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
