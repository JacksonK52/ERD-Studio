import { jsPDF } from "jspdf";

/**
 * Builds a single-page PDF sized to the diagram's own aspect ratio (like
 * a poster export) rather than forcing an arbitrary A4/Letter page —
 * diagrams are often wide and don't fit portrait paper well. Embeds the
 * same high-resolution raster as the PNG export, so all three formats
 * ("SVG, PNG, PDF should represent the same logical diagram" — §19)
 * genuinely show the same rendering, just packaged differently.
 */
export async function buildDiagramPDF(pngBlob: Blob, width: number, height: number): Promise<Blob> {
  const dataUrl = await blobToDataURL(pngBlob);

  const doc = new jsPDF({
    orientation: width >= height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
    compress: true,
  });

  doc.addImage(dataUrl, "PNG", 0, 0, width, height, undefined, "FAST");

  return doc.output("blob");
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't prepare the image for PDF export."));
    reader.readAsDataURL(blob);
  });
}
