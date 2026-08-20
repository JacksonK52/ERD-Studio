import {
  COLUMN_TYPES,
  PROJECT_FORMAT_VERSION,
  type CardinalityEnd,
  type ColumnType,
  type Diagram,
  type DiagramColumn,
  type DiagramNote,
  type DiagramRelationship,
  type DiagramTable,
} from "../types/diagram";

export type ValidationResult =
  | { ok: true; diagram: Diagram }
  | { ok: false; error: string };

// ---- small primitive helpers ---------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function clampedNumber(v: unknown, fallback: number, min: number, max: number): number {
  return isFiniteNumber(v) ? clamp(v, min, max) : fallback;
}

function truncatedString(v: unknown, fallback: string, maxLength: number): string {
  if (typeof v !== "string") return fallback;
  const trimmed = v.trim();
  if (!trimmed) return fallback;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

/** Text fields (note bodies) — no "fallback" concept, empty is valid. */
function boundedText(v: unknown, maxLength: number): string {
  if (typeof v !== "string") return "";
  return v.length > maxLength ? v.slice(0, maxLength) : v;
}

function optionalColor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  // A conservative hex-color check — anything else (including accidental
  // executable-looking strings) is dropped rather than trusted verbatim.
  return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : null;
}

const NAME_MAX = 120;
const NOTE_TEXT_MAX = 20000;
const POSITION_BOUND = 200000;
const SIZE_MIN = 10;
const SIZE_MAX = 20000;

// ---- per-entity validators -------------------------------------------------

function validatePosition(v: unknown): { x: number; y: number } {
  const obj = isObject(v) ? v : {};
  return {
    x: clampedNumber(obj.x, 0, -POSITION_BOUND, POSITION_BOUND),
    y: clampedNumber(obj.y, 0, -POSITION_BOUND, POSITION_BOUND),
  };
}

function validateColumn(v: unknown, index: number): DiagramColumn | null {
  if (!isObject(v)) return null;
  if (!isNonEmptyString(v.id)) return null;
  const meta = isObject(v.meta) ? v.meta : {};
  const type = typeof v.type === "string" && (COLUMN_TYPES as string[]).includes(v.type)
    ? (v.type as ColumnType)
    : "VARCHAR";
  return {
    id: v.id,
    name: truncatedString(v.name, "column", NAME_MAX),
    type,
    meta: {
      pk: meta.pk === true,
      fk: meta.fk === true,
      nullable: meta.nullable === true,
      unique: meta.unique === true,
    },
    order: clampedNumber(v.order, index, 0, 100000),
  };
}

function validateTable(v: unknown): DiagramTable | null {
  if (!isObject(v)) return null;
  if (!isNonEmptyString(v.id)) return null;
  const rawColumns = Array.isArray(v.columns) ? v.columns : [];
  const columns = rawColumns
    .map((c, i) => validateColumn(c, i))
    .filter((c): c is DiagramColumn => c !== null);
  return {
    id: v.id,
    name: truncatedString(v.name, "table", NAME_MAX),
    position: validatePosition(v.position),
    color: optionalColor(v.color),
    columns,
  };
}

function validateCardinalityEnd(v: unknown): CardinalityEnd {
  const obj = isObject(v) ? v : {};
  const multiplicity = obj.multiplicity === "many" ? "many" : "one";
  const optionality = obj.optionality === "optional" ? "optional" : "mandatory";
  return { multiplicity, optionality };
}

function validateRelationship(
  v: unknown,
  columnIds: Set<string>,
  tableIdByColumn: Map<string, string>,
): DiagramRelationship | null {
  if (!isObject(v)) return null;
  if (!isNonEmptyString(v.id)) return null;
  if (!isNonEmptyString(v.sourceColumnId) || !isNonEmptyString(v.targetColumnId)) return null;
  if (!columnIds.has(v.sourceColumnId) || !columnIds.has(v.targetColumnId)) return null;
  const sourceTableId = tableIdByColumn.get(v.sourceColumnId);
  const targetTableId = tableIdByColumn.get(v.targetColumnId);
  if (!sourceTableId || !targetTableId) return null;
  return {
    id: v.id,
    sourceTableId,
    sourceColumnId: v.sourceColumnId,
    targetTableId,
    targetColumnId: v.targetColumnId,
    source: validateCardinalityEnd(v.source),
    target: validateCardinalityEnd(v.target),
    color: optionalColor(v.color),
  };
}

function validateNote(v: unknown): DiagramNote | null {
  if (!isObject(v)) return null;
  if (!isNonEmptyString(v.id)) return null;
  const size = isObject(v.size) ? v.size : {};
  return {
    id: v.id,
    text: boundedText(v.text, NOTE_TEXT_MAX),
    position: validatePosition(v.position),
    size: {
      width: clampedNumber(size.width, 200, SIZE_MIN, SIZE_MAX),
      height: clampedNumber(size.height, 140, SIZE_MIN, SIZE_MAX),
    },
    color: optionalColor(v.color),
  };
}

// ---- top-level ------------------------------------------------------------

/**
 * Validates and sanitizes an arbitrary JSON value into a safe, internally
 * consistent Diagram. Individual malformed entities (a bad table, a
 * dangling relationship, ...) are dropped rather than failing the whole
 * file; only a fundamentally non-diagram-shaped input is rejected
 * outright (masterplan §21 — fail gracefully, don't crash the editor).
 */
export function validateDiagram(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return { ok: false, error: "This file doesn't look like an ERD Studio project." };
  }
  if (!Array.isArray(data.tables) || !isObject(data.grid) || !isObject(data.viewport)) {
    return { ok: false, error: "This file doesn't look like an ERD Studio project." };
  }

  const tables = data.tables
    .map((t) => validateTable(t))
    .filter((t): t is DiagramTable => t !== null);

  const columnIds = new Set<string>();
  const tableIdByColumn = new Map<string, string>();
  for (const table of tables) {
    for (const column of table.columns) {
      columnIds.add(column.id);
      tableIdByColumn.set(column.id, table.id);
    }
  }

  const rawRelationships = Array.isArray(data.relationships) ? data.relationships : [];
  const relationships = rawRelationships
    .map((r) => validateRelationship(r, columnIds, tableIdByColumn))
    .filter((r): r is DiagramRelationship => r !== null);

  const rawNotes = Array.isArray(data.notes) ? data.notes : [];
  const notes = rawNotes.map((n) => validateNote(n)).filter((n): n is DiagramNote => n !== null);

  const meta = isObject(data.meta) ? data.meta : {};
  const grid = data.grid;
  const viewport = data.viewport;

  const now = new Date().toISOString();
  const diagram: Diagram = {
    meta: {
      id: isNonEmptyString(meta.id) ? meta.id : crypto.randomUUID(),
      name: truncatedString(meta.name, "Untitled Diagram", NAME_MAX),
      formatVersion: PROJECT_FORMAT_VERSION,
      createdAt: isNonEmptyString(meta.createdAt) ? meta.createdAt : now,
      updatedAt: now,
    },
    tables,
    relationships,
    notes,
    grid: {
      visible: grid.visible !== false,
      snapToGrid: grid.snapToGrid !== false,
      size: clampedNumber(grid.size, 16, 4, 100),
    },
    viewport: {
      x: clampedNumber(viewport.x, 0, -POSITION_BOUND, POSITION_BOUND),
      y: clampedNumber(viewport.y, 0, -POSITION_BOUND, POSITION_BOUND),
      zoom: clampedNumber(viewport.zoom, 1, 0.1, 2.5),
    },
  };

  return { ok: true, diagram };
}
