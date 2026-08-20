export interface ShortcutDisplayEntry {
  keys: string;
  description: string;
}

/** Masterplan §10's recommended defaults, in the same order. */
export const SHORTCUT_REGISTRY: ShortcutDisplayEntry[] = [
  { keys: "V", description: "Select tool" },
  { keys: "T", description: "Table tool" },
  { keys: "N", description: "Note tool" },
  { keys: "Delete / Backspace", description: "Delete selected" },
  { keys: "Ctrl/Cmd + Z", description: "Undo" },
  { keys: "Ctrl/Cmd + Shift + Z", description: "Redo" },
  { keys: "Ctrl/Cmd + S", description: "Save project" },
  { keys: "Ctrl/Cmd + O", description: "Open project" },
  { keys: "Ctrl/Cmd + A", description: "Select all" },
  { keys: "Esc", description: "Return to selection mode" },
  { keys: "?", description: "Show this help" },
];
