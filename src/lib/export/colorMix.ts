function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(h.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Replicates `color-mix(in srgb, ${hex} ${percent}%, white)` as plain RGB
 * math, so exported SVG/PNG/PDF files don't depend on the browser
 * resolving a live CSS color-mix() function — they need a concrete hex
 * value baked in to be portable.
 */
export function mixWithWhite(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = percent / 100;
  return rgbToHex(r * t + 255 * (1 - t), g * t + 255 * (1 - t), b * t + 255 * (1 - t));
}
