import { nanoid } from "nanoid";
import type {
  CardinalityEnd,
  ColumnMeta,
  ColumnType,
  Diagram,
  DiagramColumn,
  DiagramNote,
  DiagramRelationship,
  DiagramTable,
} from "../types/diagram";

function withTable(
  diagram: Diagram,
  tableId: string,
  updater: (table: DiagramTable) => DiagramTable,
): Diagram {
  return {
    ...diagram,
    tables: diagram.tables.map((t) => (t.id === tableId ? updater(t) : t)),
  };
}

function uniqueName(existing: string[], base: string): string {
  const taken = new Set(existing);
  let n = existing.length + 1;
  let name = `${base}_${n}`;
  while (taken.has(name)) {
    n += 1;
    name = `${base}_${n}`;
  }
  return name;
}

// ---- Tables ----------------------------------------------------------

export function createTable(
  diagram: Diagram,
  position: { x: number; y: number },
  id: string = nanoid(),
): Diagram {
  const table: DiagramTable = {
    id,
    name: uniqueName(
      diagram.tables.map((t) => t.name),
      "table",
    ),
    position,
    columns: [
      {
        id: nanoid(),
        name: "id",
        type: "INT",
        meta: { pk: true, fk: false, nullable: false, unique: false },
        order: 0,
      },
    ],
  };
  return { ...diagram, tables: [...diagram.tables, table] };
}

export function renameTable(diagram: Diagram, tableId: string, name: string): Diagram {
  const trimmed = name.trim();
  if (!trimmed) return diagram;
  return withTable(diagram, tableId, (t) => ({ ...t, name: trimmed }));
}

/** Commit positions for several tables and/or notes at once — used for
 * group/multi drags, since a selection can mix both element types. */
export function moveElements(
  diagram: Diagram,
  positions: Array<{ id: string; position: { x: number; y: number } }>,
): Diagram {
  const positionById = new Map(positions.map((p) => [p.id, p.position]));
  let changed = false;

  const tables = diagram.tables.map((t) => {
    const position = positionById.get(t.id);
    if (!position || (position.x === t.position.x && position.y === t.position.y)) return t;
    changed = true;
    return { ...t, position };
  });

  const notes = diagram.notes.map((n) => {
    const position = positionById.get(n.id);
    if (!position || (position.x === n.position.x && position.y === n.position.y)) return n;
    changed = true;
    return { ...n, position };
  });

  return changed ? { ...diagram, tables, notes } : diagram;
}

export function setTableColor(diagram: Diagram, tableId: string, color: string | null): Diagram {
  return withTable(diagram, tableId, (t) => (t.color === color ? t : { ...t, color }));
}

export function deleteTable(diagram: Diagram, tableId: string): Diagram {
  return {
    ...diagram,
    tables: diagram.tables.filter((t) => t.id !== tableId),
    // Cascading cleanup (masterplan §7) — a no-op today since relationships
    // don't exist yet, but written now so Phase 3 doesn't need to revisit it.
    relationships: diagram.relationships.filter(
      (r) => r.sourceTableId !== tableId && r.targetTableId !== tableId,
    ),
  };
}

// ---- Columns -----------------------------------------------------------

export function addColumn(diagram: Diagram, tableId: string): Diagram {
  return withTable(diagram, tableId, (t) => {
    const column: DiagramColumn = {
      id: nanoid(),
      name: uniqueName(
        t.columns.map((c) => c.name),
        "column",
      ),
      type: "VARCHAR",
      meta: { pk: false, fk: false, nullable: true, unique: false },
      order: t.columns.length,
    };
    return { ...t, columns: [...t.columns, column] };
  });
}

export function renameColumn(
  diagram: Diagram,
  tableId: string,
  columnId: string,
  name: string,
): Diagram {
  const trimmed = name.trim();
  if (!trimmed) return diagram;
  return withTable(diagram, tableId, (t) => ({
    ...t,
    columns: t.columns.map((c) => (c.id === columnId ? { ...c, name: trimmed } : c)),
  }));
}

export function changeColumnType(
  diagram: Diagram,
  tableId: string,
  columnId: string,
  type: ColumnType,
): Diagram {
  return withTable(diagram, tableId, (t) => ({
    ...t,
    columns: t.columns.map((c) => (c.id === columnId ? { ...c, type } : c)),
  }));
}

export function toggleColumnMeta(
  diagram: Diagram,
  tableId: string,
  columnId: string,
  key: keyof ColumnMeta,
): Diagram {
  return withTable(diagram, tableId, (t) => ({
    ...t,
    columns: t.columns.map((c) =>
      c.id === columnId ? { ...c, meta: { ...c.meta, [key]: !c.meta[key] } } : c,
    ),
  }));
}

export function deleteColumn(diagram: Diagram, tableId: string, columnId: string): Diagram {
  const withoutColumn = withTable(diagram, tableId, (t) => ({
    ...t,
    columns: t.columns
      .filter((c) => c.id !== columnId)
      .map((c, index) => ({ ...c, order: index })),
  }));
  return {
    ...withoutColumn,
    relationships: withoutColumn.relationships.filter(
      (r) => r.sourceColumnId !== columnId && r.targetColumnId !== columnId,
    ),
  };
}

export function reorderColumns(
  diagram: Diagram,
  tableId: string,
  orderedColumnIds: string[],
): Diagram {
  return withTable(diagram, tableId, (t) => {
    const byId = new Map(t.columns.map((c) => [c.id, c]));
    const reordered = orderedColumnIds
      .map((id) => byId.get(id))
      .filter((c): c is DiagramColumn => Boolean(c))
      .map((c, index) => ({ ...c, order: index }));
    return { ...t, columns: reordered };
  });
}

// ---- Relationships (masterplan §6) --------------------------------------

interface ConnectionEndpoint {
  tableId: string;
  columnId: string;
}

/**
 * Every new relationship defaults to 1:N — source end is "one", target end
 * is "many" — regardless of which column was dragged from. This keeps the
 * common case a single drag, with the cardinality popup available right
 * after for the cases where that default is wrong (masterplan §6).
 */
export function createRelationship(
  diagram: Diagram,
  source: ConnectionEndpoint,
  target: ConnectionEndpoint,
  id: string = nanoid(),
): Diagram {
  if (source.columnId === target.columnId) return diagram;

  const alreadyConnected = diagram.relationships.some(
    (r) =>
      (r.sourceColumnId === source.columnId && r.targetColumnId === target.columnId) ||
      (r.sourceColumnId === target.columnId && r.targetColumnId === source.columnId),
  );
  if (alreadyConnected) return diagram;

  const relationship: DiagramRelationship = {
    id,
    sourceTableId: source.tableId,
    sourceColumnId: source.columnId,
    targetTableId: target.tableId,
    targetColumnId: target.columnId,
    source: { multiplicity: "one", optionality: "mandatory" },
    target: { multiplicity: "many", optionality: "mandatory" },
  };
  return { ...diagram, relationships: [...diagram.relationships, relationship] };
}

export function deleteRelationship(diagram: Diagram, relationshipId: string): Diagram {
  return {
    ...diagram,
    relationships: diagram.relationships.filter((r) => r.id !== relationshipId),
  };
}

export function updateRelationshipEnd(
  diagram: Diagram,
  relationshipId: string,
  end: "source" | "target",
  patch: Partial<CardinalityEnd>,
): Diagram {
  return {
    ...diagram,
    relationships: diagram.relationships.map((r) =>
      r.id === relationshipId ? { ...r, [end]: { ...r[end], ...patch } } : r,
    ),
  };
}

export function setRelationshipColor(
  diagram: Diagram,
  relationshipId: string,
  color: string | null,
): Diagram {
  return {
    ...diagram,
    relationships: diagram.relationships.map((r) =>
      r.id === relationshipId && r.color !== color ? { ...r, color } : r,
    ),
  };
}

// ---- Notes (masterplan §4/§22 Phase 4) ----------------------------------

const DEFAULT_NOTE_SIZE = { width: 200, height: 140 };

export function createNote(
  diagram: Diagram,
  position: { x: number; y: number },
  id: string = nanoid(),
): Diagram {
  const note: DiagramNote = {
    id,
    text: "",
    position,
    size: { ...DEFAULT_NOTE_SIZE },
    color: null,
  };
  return { ...diagram, notes: [...diagram.notes, note] };
}

export function updateNoteText(diagram: Diagram, noteId: string, text: string): Diagram {
  return {
    ...diagram,
    notes: diagram.notes.map((n) => (n.id === noteId && n.text !== text ? { ...n, text } : n)),
  };
}

export function resizeNote(
  diagram: Diagram,
  noteId: string,
  size: { width: number; height: number },
  position?: { x: number; y: number },
): Diagram {
  return {
    ...diagram,
    notes: diagram.notes.map((n) =>
      n.id === noteId ? { ...n, size, position: position ?? n.position } : n,
    ),
  };
}

export function setNoteColor(diagram: Diagram, noteId: string, color: string | null): Diagram {
  return {
    ...diagram,
    notes: diagram.notes.map((n) => (n.id === noteId && n.color !== color ? { ...n, color } : n)),
  };
}

export function deleteNote(diagram: Diagram, noteId: string): Diagram {
  return { ...diagram, notes: diagram.notes.filter((n) => n.id !== noteId) };
}

// ---- Multi-select deletion (masterplan §10 — Delete/Backspace) --------

export interface SelectedElementIds {
  tableIds: Set<string>;
  noteIds: Set<string>;
  relationshipIds: Set<string>;
}

/** Removes every selected table, note, and relationship as a single
 * undo step, cascading to relationships attached to any deleted table
 * (same cleanup rule as a single deleteTable). */
export function deleteElements(diagram: Diagram, ids: SelectedElementIds): Diagram {
  if (ids.tableIds.size === 0 && ids.noteIds.size === 0 && ids.relationshipIds.size === 0) {
    return diagram;
  }
  return {
    ...diagram,
    tables: diagram.tables.filter((t) => !ids.tableIds.has(t.id)),
    notes: diagram.notes.filter((n) => !ids.noteIds.has(n.id)),
    relationships: diagram.relationships.filter(
      (r) =>
        !ids.relationshipIds.has(r.id) &&
        !ids.tableIds.has(r.sourceTableId) &&
        !ids.tableIds.has(r.targetTableId),
    ),
  };
}
