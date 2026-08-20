import { useEffect, useRef, type RefObject } from "react";

/**
 * Focus an element once, deferred past the current synchronous native
 * event dispatch. When an element is created by a pane click (new table,
 * new note), the browser's native "click" event is still pending after
 * our render and would otherwise refocus the newly-mounted, focusable
 * node wrapper right after we focus the field inside it. See
 * InlineEditableText for the full story — same fix, shared here for
 * elements that don't need the "only defer the very first time" nuance.
 */
export function useDeferredFocus(ref: RefObject<HTMLElement | null>, shouldFocus: boolean) {
  // Captured once at mount. `shouldFocus` is usually derived from a
  // "pending focus id" flag that the caller clears in its own effect
  // moments later — if this hook re-read the live prop, that clear
  // would flip shouldFocus to false and cancel the timer before it
  // fires. Mount-time value only, deliberately ignoring later changes.
  const shouldFocusOnMount = useRef(shouldFocus);

  useEffect(() => {
    if (!shouldFocusOnMount.current) return;
    const timer = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        el.select();
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
