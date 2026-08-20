import { getSmoothStepPath, Position } from "@xyflow/react";
import type { Diagram, DiagramTable } from "../../types/diagram";
import {
  EXPORT_COLORS,
  FONT_MONO,
  FONT_UI,
  NOTE_CORNER_RADIUS,
  NOTE_FONT_SIZE,
  NOTE_LINE_HEIGHT,
  NOTE_PADDING,
  TABLE_COLOR_STRIPE_WIDTH,
  TABLE_CORNER_RADIUS,
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT,
} from "./constants";
import { mixWithWhite } from "./colorMix";
import { columnRowCenterY, computeLayout, type NoteGeometry, type TableGeometry } from "./layout";
import { CROWSFOOT_MARKERS_SVG } from "./markerDefs";
import { markerUrlFor } from "../markerId";
import { pickHandleSides } from "../relationshipRouting";
import { wrapText } from "./textWrap";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function textEl(
  x: number,
  y: number,
  content: string,
  attrs: Record<string, string | number> = {},
): SVGTextElement {
  const el = svgEl("text", { x, y, ...attrs });
  el.textContent = content; // textContent, not innerHTML — safe against arbitrary user text
  return el;
}

let truncateCanvas: HTMLCanvasElement | undefined;

/** Truncates with an ellipsis if the text is wider than maxWidth, using
 * the same canvas-measurement approach as the note wrapper. */
function truncateToWidth(text: string, maxWidth: number, font: string): string {
  if (!truncateCanvas) truncateCanvas = document.createElement("canvas");
  const ctx = truncateCanvas.getContext("2d");
  if (!ctx) return text;
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (ctx.measureText(text.slice(0, mid) + "…").width <= maxWidth) low = mid;
    else high = mid - 1;
  }
  return text.slice(0, low) + "…";
}

function renderTable(geom: TableGeometry): SVGGElement {
  const { table, x, y, width, height } = geom;
  const g = svgEl("g");

  const body = svgEl("rect", {
    x,
    y,
    width,
    height,
    rx: TABLE_CORNER_RADIUS,
    fill: EXPORT_COLORS.surface,
    stroke: EXPORT_COLORS.border,
    "stroke-width": 1,
  });
  g.appendChild(body);

  if (table.color) {
    g.appendChild(
      svgEl("rect", {
        x,
        y,
        width: TABLE_COLOR_STRIPE_WIDTH,
        height,
        rx: TABLE_COLOR_STRIPE_WIDTH / 2,
        fill: table.color,
      }),
    );
  }

  // Header
  g.appendChild(
    svgEl("line", {
      x1: x,
      y1: y + TABLE_HEADER_HEIGHT,
      x2: x + width,
      y2: y + TABLE_HEADER_HEIGHT,
      stroke: EXPORT_COLORS.border,
      "stroke-width": 1,
    }),
  );
  g.appendChild(
    textEl(x + 12, y + TABLE_HEADER_HEIGHT / 2 + 4, truncateToWidth(table.name, width - 24, `600 13px ${FONT_UI}`), {
      "font-family": FONT_UI,
      "font-weight": 600,
      "font-size": 13,
      fill: EXPORT_COLORS.text,
    }),
  );

  // Columns
  table.columns.forEach((column, index) => {
    const rowY = y + TABLE_HEADER_HEIGHT + index * TABLE_ROW_HEIGHT;
    const centerY = rowY + TABLE_ROW_HEIGHT / 2 + 4;

    const badges: string[] = [];
    if (column.meta.pk) badges.push("PK");
    if (column.meta.fk) badges.push("FK");
    if (column.meta.nullable) badges.push("N");
    if (column.meta.unique) badges.push("U");

    // Badges are right-aligned; reserve space for them and the type label.
    const badgeText = badges.join(" ");
    const badgesWidth = badges.length > 0 ? badgeText.length * 7 + (badges.length - 1) * 4 + 4 : 0;
    const typeMaxWidth = 52;
    const nameMaxWidth = width - 20 - typeMaxWidth - badgesWidth - 12;

    g.appendChild(
      textEl(
        x + 12,
        centerY,
        truncateToWidth(column.name, nameMaxWidth, `11.5px ${FONT_MONO}`),
        { "font-family": FONT_MONO, "font-size": 11.5, fill: EXPORT_COLORS.text },
      ),
    );

    const typeX = x + 12 + nameMaxWidth + 10;
    g.appendChild(
      textEl(typeX, centerY, column.type, {
        "font-family": FONT_MONO,
        "font-size": 10.5,
        fill: EXPORT_COLORS.textMuted,
      }),
    );

    let badgeX = x + width - 10;
    for (let i = badges.length - 1; i >= 0; i--) {
      const label = badges[i];
      const w = label.length * 6 + 8;
      badgeX -= w;
      g.appendChild(
        svgEl("rect", {
          x: badgeX,
          y: centerY - 11,
          width: w,
          height: 14,
          rx: 3,
          fill: EXPORT_COLORS.accentSoft,
        }),
      );
      g.appendChild(
        textEl(badgeX + w / 2, centerY - 1, label, {
          "font-family": FONT_UI,
          "font-weight": 600,
          "font-size": 9,
          fill: EXPORT_COLORS.accent,
          "text-anchor": "middle",
        }),
      );
      badgeX -= 4;
    }
  });

  return g;
}

function renderNote(geom: NoteGeometry): SVGGElement {
  const { note, x, y, width, height } = geom;
  const g = svgEl("g");

  const background = note.color ? mixWithWhite(note.color, 14) : EXPORT_COLORS.surface;
  const border = note.color ? mixWithWhite(note.color, 45) : EXPORT_COLORS.border;

  g.appendChild(
    svgEl("rect", {
      x,
      y,
      width,
      height,
      rx: NOTE_CORNER_RADIUS,
      fill: background,
      stroke: border,
      "stroke-width": 1,
    }),
  );

  const font = `${NOTE_FONT_SIZE}px ${FONT_UI}`;
  const maxTextWidth = width - NOTE_PADDING * 2;
  const lines = wrapText(note.text, maxTextWidth, font);
  const maxLines = Math.max(1, Math.floor((height - NOTE_PADDING * 2) / NOTE_LINE_HEIGHT));
  const visibleLines = lines.slice(0, maxLines);

  const textNode = svgEl("text", {
    x: x + NOTE_PADDING,
    y: y + NOTE_PADDING + NOTE_FONT_SIZE,
    "font-family": FONT_UI,
    "font-size": NOTE_FONT_SIZE,
    fill: EXPORT_COLORS.text,
  });
  visibleLines.forEach((line, i) => {
    const tspan = svgEl("tspan", {
      x: x + NOTE_PADDING,
      dy: i === 0 ? 0 : NOTE_LINE_HEIGHT,
    });
    tspan.textContent = line;
    textNode.appendChild(tspan);
  });
  g.appendChild(textNode);

  return g;
}

/**
 * Renders the whole diagram to a standalone SVG element. All three export
 * formats (SVG, PNG, PDF) start from this one function, per masterplan
 * §19 — exports come from the diagram model, not a screenshot of the app.
 */
export function renderDiagramSVG(diagram: Diagram): { svg: SVGSVGElement; width: number; height: number } {
  const layout = computeLayout(diagram);

  const svg = svgEl("svg", {
    xmlns: SVG_NS,
    viewBox: `${layout.minX} ${layout.minY} ${layout.width} ${layout.height}`,
    width: layout.width,
    height: layout.height,
  });

  const defs = svgEl("defs");
  defs.innerHTML = CROWSFOOT_MARKERS_SVG; // static, hardcoded markup — not user input
  svg.appendChild(defs);

  svg.appendChild(
    svgEl("rect", {
      x: layout.minX,
      y: layout.minY,
      width: layout.width,
      height: layout.height,
      fill: EXPORT_COLORS.surface,
    }),
  );

  // Relationships first, so table cards sit visually on top of the lines
  // meeting their edges (matches the live canvas's stacking).
  const tableById = new Map<string, DiagramTable>(diagram.tables.map((t) => [t.id, t]));
  for (const rel of diagram.relationships) {
    const sourceGeom = layout.tableById.get(rel.sourceTableId);
    const targetGeom = layout.tableById.get(rel.targetTableId);
    const sourceTable = tableById.get(rel.sourceTableId);
    const targetTable = tableById.get(rel.targetTableId);
    if (!sourceGeom || !targetGeom || !sourceTable || !targetTable) continue;

    const sourceColIndex = sourceTable.columns.findIndex((c) => c.id === rel.sourceColumnId);
    const targetColIndex = targetTable.columns.findIndex((c) => c.id === rel.targetColumnId);
    if (sourceColIndex === -1 || targetColIndex === -1) continue;

    const { sourceSide, targetSide } = pickHandleSides(sourceTable, targetTable);
    const sourceY = columnRowCenterY(sourceGeom, sourceColIndex);
    const targetY = columnRowCenterY(targetGeom, targetColIndex);
    const sourceX = sourceSide === "r" ? sourceGeom.x + sourceGeom.width : sourceGeom.x;
    const targetX = targetSide === "r" ? targetGeom.x + targetGeom.width : targetGeom.x;

    const [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: sourceSide === "r" ? Position.Right : Position.Left,
      targetX,
      targetY,
      targetPosition: targetSide === "r" ? Position.Right : Position.Left,
      borderRadius: 8,
    });

    const lineColor = rel.color ?? EXPORT_COLORS.relationshipLine;
    svg.appendChild(
      svgEl("path", {
        d: path,
        fill: "none",
        stroke: lineColor,
        "stroke-width": 1.25,
        color: lineColor,
        "marker-start": markerUrlFor(rel.source),
        "marker-end": markerUrlFor(rel.target),
      }),
    );
  }

  for (const noteGeom of layout.notes) {
    svg.appendChild(renderNote(noteGeom));
  }

  for (const tableGeom of layout.tables) {
    svg.appendChild(renderTable(tableGeom));
  }

  return { svg, width: layout.width, height: layout.height };
}

export function serializeSVG(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", SVG_NS);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}
