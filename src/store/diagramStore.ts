import { create } from "zustand";
import {
  createEmptyDiagram,
  type Diagram,
  type DiagramNote,
  type DiagramRelationship,
  type DiagramTable,
  type GridConfig,
  type ViewportConfig,
} from "../types/diagram";

/**
 * History system (masterplan section 15 / Challenge 3).
 *
 * Only the *structural* parts of the diagram (tables, relationships, notes)
 * are tracked in undo/redo history. Canvas preferences like grid and
 * viewport are treated as UI state, not editable content, so panning or
 * zooming never gets undone.
 *
 * Later phases call `commit()` with a mutator function so that every edit
 * (add table, delete column + its relationships, move a note, ...) becomes
 * a single undoable step, rather than many low-level field writes.
 */

interface StructuralSnapshot {
  tables: DiagramTable[];
  relationships: DiagramRelationship[];
  notes: DiagramNote[];
}

const MAX_HISTORY = 100;

function snapshotOf(diagram: Diagram): StructuralSnapshot {
  return {
    tables: diagram.tables,
    relationships: diagram.relationships,
    notes: diagram.notes,
  };
}

interface DiagramState {
  diagram: Diagram;
  past: StructuralSnapshot[];
  future: StructuralSnapshot[];

  /** Replace the whole diagram (used by "New" / "Open"). Clears history. */
  loadDiagram: (diagram: Diagram) => void;

  /** Apply a structural edit as a single undoable operation. */
  commit: (mutate: (diagram: Diagram) => Diagram) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  /** Non-undoable UI-ish preferences that still live in the project file. */
  updateGrid: (partial: Partial<GridConfig>) => void;
  updateViewport: (viewport: ViewportConfig) => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  diagram: createEmptyDiagram(),
  past: [],
  future: [],

  loadDiagram: (diagram) => set({ diagram, past: [], future: [] }),

  commit: (mutate) =>
    set((state) => {
      const next = mutate(state.diagram);
      // Several operations guard against invalid edits (empty rename,
      // duplicate/self relationships, ...) by returning the diagram
      // unchanged. Skip history entirely for those — a no-op shouldn't
      // occupy an undo step or trigger downstream re-renders.
      if (next === state.diagram) return state;
      const prevSnapshot = snapshotOf(state.diagram);
      return {
        diagram: {
          ...next,
          meta: { ...next.meta, updatedAt: new Date().toISOString() },
        },
        past: [...state.past, prevSnapshot].slice(-MAX_HISTORY),
        future: [],
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const snapshot = state.past[state.past.length - 1];
      const currentSnapshot = snapshotOf(state.diagram);
      return {
        diagram: { ...state.diagram, ...snapshot },
        past: state.past.slice(0, -1),
        future: [currentSnapshot, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const snapshot = state.future[0];
      const currentSnapshot = snapshotOf(state.diagram);
      return {
        diagram: { ...state.diagram, ...snapshot },
        past: [...state.past, currentSnapshot],
        future: state.future.slice(1),
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  updateGrid: (partial) =>
    set((state) => ({
      diagram: { ...state.diagram, grid: { ...state.diagram.grid, ...partial } },
    })),

  updateViewport: (viewport) =>
    set((state) => ({ diagram: { ...state.diagram, viewport } })),
}));
