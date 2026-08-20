/**
 * Rasterizes an SVG (as markup + pixel dimensions) into a PNG blob, by
 * drawing it into an offscreen canvas at a higher pixel density than
 * screen resolution — masterplan §19: "enough resolution for
 * documentation and sharing".
 */
const EXPORT_SCALE = 2; // ~equivalent to a 2x/retina render

export function rasterizeSVGToPNG(
  svgMarkup: string,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(width * EXPORT_SCALE);
        canvas.height = Math.ceil(height * EXPORT_SCALE);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D canvas context unavailable");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
        ctx.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Couldn't generate PNG data."));
        }, "image/png");
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err instanceof Error ? err : new Error("PNG rendering failed."));
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't rasterize the diagram."));
    };
    image.src = url;
  });
}
