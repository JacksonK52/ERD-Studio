/**
 * Layout constants for the static export renderer. These mirror the live
 * TableNode/NoteNode's actual rendered proportions (Tailwind classes like
 * `py-1.5`, `text-[13px]`, etc.) so exports visually match the app rather
 * than looking like a distinct, simplified reinterpretation.
 */

export const TABLE_WIDTH = 240;
export const TABLE_HEADER_HEIGHT = 30;
export const TABLE_ROW_HEIGHT = 22;
export const TABLE_CORNER_RADIUS = 8;
export const TABLE_COLOR_STRIPE_WIDTH = 4;

export const NOTE_CORNER_RADIUS = 8;
export const NOTE_PADDING = 10;
export const NOTE_LINE_HEIGHT = 16;
export const NOTE_FONT_SIZE = 12.5;

export const DIAGRAM_MARGIN = 48;

export const FONT_UI = "Inter, ui-sans-serif, system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace";

/** Plain hex equivalents of the app's CSS custom properties — exports must
 * be self-contained and not depend on any external stylesheet resolving
 * `var(--color-*)` (a plain SVG file, or a canvas rasterizer, may not). */
export const EXPORT_COLORS = {
  surface: "#ffffff",
  border: "#e4e4e7",
  borderStrong: "#d4d4d8",
  text: "#18181b",
  textMuted: "#71717a",
  textFaint: "#a1a1aa",
  accentSoft: "#eef2ff",
  accent: "#4f46e5",
  /** Slightly darker than the live canvas's default edge color — the
   * live app leans light because it's next to interactive UI, but a
   * printed/exported document benefits from a bit more contrast. */
  relationshipLine: "#52525b",
};
