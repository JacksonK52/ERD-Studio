import type { Diagram, DiagramNote, DiagramTable } from "../../types/diagram";
import { DIAGRAM_MARGIN, TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT, TABLE_WIDTH } from "./constants";

export interface TableGeometry {
  table: DiagramTable;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NoteGeometry {
  note: DiagramNote;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramLayout {
  tables: TableGeometry[];
  notes: NoteGeometry[];
  tableById: Map<string, TableGeometry>;
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function computeTableHeight(table: DiagramTable): number {
  return TABLE_HEADER_HEIGHT + table.columns.length * TABLE_ROW_HEIGHT;
}

export function computeLayout(diagram: Diagram): DiagramLayout {
  const tables: TableGeometry[] = diagram.tables.map((table) => ({
    table,
    x: table.position.x,
    y: table.position.y,
    width: TABLE_WIDTH,
    height: computeTableHeight(table),
  }));

  const notes: NoteGeometry[] = diagram.notes.map((note) => ({
    note,
    x: note.position.x,
    y: note.position.y,
    width: note.size.width,
    height: note.size.height,
  }));

  const tableById = new Map(tables.map((t) => [t.table.id, t]));

  const boxes: Array<{ x: number; y: number; width: number; height: number }> = [
    ...tables,
    ...notes,
  ];

  if (boxes.length === 0) {
    // Nothing to export — a small placeholder canvas rather than a
    // zero-size or NaN-bounded SVG.
    return { tables, notes, tableById, minX: 0, minY: 0, width: 400, height: 300 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return {
    tables,
    notes,
    tableById,
    minX: minX - DIAGRAM_MARGIN,
    minY: minY - DIAGRAM_MARGIN,
    width: maxX - minX + DIAGRAM_MARGIN * 2,
    height: maxY - minY + DIAGRAM_MARGIN * 2,
  };
}

/** Vertical center (absolute diagram coordinates) of a column's row,
 * given its position in the table's column order. */
export function columnRowCenterY(tableGeom: TableGeometry, columnOrderIndex: number): number {
  return tableGeom.y + TABLE_HEADER_HEIGHT + (columnOrderIndex + 0.5) * TABLE_ROW_HEIGHT;
}
