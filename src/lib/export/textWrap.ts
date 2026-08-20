let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    measureCtx = ctx;
  }
  return measureCtx;
}

/**
 * Breaks text into lines that fit maxWidth, respecting existing newlines.
 * Uses the canvas 2D API purely for text measurement (not drawing) — the
 * standard, reliable way to word-wrap for a custom SVG/canvas renderer.
 */
export function wrapText(text: string, maxWidth: number, font: string): string[] {
  const ctx = getMeasureContext();
  ctx.font = font;
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (paragraph === "") {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}
