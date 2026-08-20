/**
 * Conceptual data model for the ER diagram.
 * Mirrors masterplan section 16 — stable internal identifiers,
 * generic (not database-specific) types.
 */

export const PROJECT_FORMAT_VERSION = 1;

// ---- Column ----------------------------------------------------------

export type ColumnType =
  | "INT"
  | "BIGINT"
  | "DECIMAL"
  | "FLOAT"
  | "BOOLEAN"
  | "VARCHAR"
  | "TEXT"
  | "DATE"
  | "DATETIME"
  | "TIMESTAMP"
  | "UUID"
  | "JSON";

export const COLUMN_TYPES: ColumnType[] = [
  "INT",
  "BIGINT",
  "DECIMAL",
  "FLOAT",
  "BOOLEAN",
  "VARCHAR",
  "TEXT",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "UUID",
  "JSON",
];

export interface ColumnMeta {
  pk: boolean;
  fk: boolean;
  nullable: boolean;
  unique: boolean;
}

export interface DiagramColumn {
  id: string;
  name: string;
  type: ColumnType;
  meta: ColumnMeta;
  /** Display order within the table (0-indexed). */
  order: number;
}

// ---- Table -------------------------------------------------------------

export interface DiagramTable {
  id: string;
  name: string;
  position: { x: number; y: number };
  width?: number;
  color?: string | null;
  columns: DiagramColumn[];
}

// ---- Relationship --------------------------------------------------------

export type CardinalitySide = "one" | "many";
export type CardinalityOptionality = "mandatory" | "optional";

export interface CardinalityEnd {
  multiplicity: CardinalitySide;
  optionality: CardinalityOptionality;
}

export interface DiagramRelationship {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  source: CardinalityEnd;
  target: CardinalityEnd;
  color?: string | null;
}

// ---- Note ----------------------------------------------------------------

export interface DiagramNote {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color?: string | null;
}

// ---- Canvas / viewport configuration --------------------------------------

export interface GridConfig {
  visible: boolean;
  snapToGrid: boolean;
  size: number;
}

export interface ViewportConfig {
  x: number;
  y: number;
  zoom: number;
}

// ---- Diagram (root) --------------------------------------------------------

export interface DiagramMeta {
  id: string;
  name: string;
  formatVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface Diagram {
  meta: DiagramMeta;
  tables: DiagramTable[];
  relationships: DiagramRelationship[];
  notes: DiagramNote[];
  grid: GridConfig;
  viewport: ViewportConfig;
}

export function createEmptyDiagram(name = "Untitled Diagram"): Diagram {
  const now = new Date().toISOString();
  return {
    meta: {
      id: crypto.randomUUID(),
      name,
      formatVersion: PROJECT_FORMAT_VERSION,
      createdAt: now,
      updatedAt: now,
    },
    tables: [],
    relationships: [],
    notes: [],
    grid: {
      visible: true,
      snapToGrid: true,
      size: 16,
    },
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}
