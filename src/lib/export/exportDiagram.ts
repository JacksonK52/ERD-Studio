import type { Diagram } from "../../types/diagram";
import { sanitizeFilename } from "../projectFile";
import { renderDiagramSVG, serializeSVG } from "./svgRenderer";
import { rasterizeSVGToPNG } from "./rasterize";
import { buildDiagramPDF } from "./pdfExport";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAsSVG(diagram: Diagram): void {
  const { svg } = renderDiagramSVG(diagram);
  const markup = serializeSVG(svg);
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `${sanitizeFilename(diagram.meta.name)}.svg`);
}

export async function exportAsPNG(diagram: Diagram): Promise<void> {
  const { svg, width, height } = renderDiagramSVG(diagram);
  const markup = serializeSVG(svg);
  const blob = await rasterizeSVGToPNG(markup, width, height);
  downloadBlob(blob, `${sanitizeFilename(diagram.meta.name)}.png`);
}

export async function exportAsPDF(diagram: Diagram): Promise<void> {
  const { svg, width, height } = renderDiagramSVG(diagram);
  const markup = serializeSVG(svg);
  const pngBlob = await rasterizeSVGToPNG(markup, width, height);
  const pdfBlob = await buildDiagramPDF(pngBlob, width, height);
  downloadBlob(pdfBlob, `${sanitizeFilename(diagram.meta.name)}.pdf`);
}
