import { useDiagramStore } from "../store/diagramStore";
import { validateDiagram } from "./diagramValidation";

const STORAGE_KEY = "erd-studio:autosave:v1";
const DEBOUNCE_MS = 800;

/**
 * Reads and validates any autosaved diagram from localStorage. Autosave
 * data is just as untrusted as an imported project file (corruption,
 * manual tampering, a future format), so it goes through the same
 * validator rather than being trusted verbatim.
 */
function loadAutosave() {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage unavailable (private browsing, disabled, ...)
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = validateDiagram(parsed);
  return result.ok ? result.diagram : null;
}

function persist(diagram: unknown) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diagram));
  } catch {
    // Quota exceeded or storage disabled — the in-memory diagram is still
    // fully usable, it just won't survive a refresh. Nothing to recover
    // from here without a notification system (masterplan §22 Phase 7).
  }
}

/**
 * Restores the last autosaved diagram (if any and valid) into the store,
 * then subscribes to future changes and persists them, debounced. Call
 * once, before the app renders, so a restored diagram doesn't flash in
 * after an empty first paint.
 */
export function initAutosave(): void {
  const restored = loadAutosave();
  if (restored) {
    useDiagramStore.getState().loadDiagram(restored);
  }

  let debounceTimer: number | null = null;
  useDiagramStore.subscribe((state, prevState) => {
    if (state.diagram === prevState.diagram) return;
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      persist(state.diagram);
      debounceTimer = null;
    }, DEBOUNCE_MS);
  });
}
