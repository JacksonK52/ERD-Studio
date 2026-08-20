export interface SwatchColor {
  id: string;
  label: string;
  hex: string;
}

/**
 * One shared, restrained palette (masterplan §11: minimal, one accent by
 * default — these are opt-in, used sparingly). Applied as a thin accent
 * (table left-border stripe, note border) rather than a solid fill, and
 * diluted via color-mix() for note backgrounds, so even saturated swatches
 * stay subtle in practice.
 */
export const SWATCH_COLORS: SwatchColor[] = [
  { id: "slate", label: "Slate", hex: "#64748b" },
  { id: "red", label: "Red", hex: "#ef4444" },
  { id: "orange", label: "Orange", hex: "#f97316" },
  { id: "amber", label: "Amber", hex: "#f59e0b" },
  { id: "green", label: "Green", hex: "#22c55e" },
  { id: "blue", label: "Blue", hex: "#3b82f6" },
  { id: "purple", label: "Purple", hex: "#a855f7" },
  { id: "pink", label: "Pink", hex: "#ec4899" },
];
