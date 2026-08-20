import { useCallback, useEffect, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import { useDiagramStore } from "../../store/diagramStore";
import { useUIStore } from "../../store/uiStore";
import {
  createNote,
  createRelationship,
  createTable,
  deleteElements,
  moveElements,
} from "../../lib/diagramOperations";
import { makeHandleId, parseHandleId } from "../../lib/handleId";
import { pickHandleSides } from "../../lib/relationshipRouting";
import { useKeyboardShortcuts } from "../../lib/useKeyboardShortcuts";
import type { Diagram, DiagramRelationship, DiagramTable } from "../../types/diagram";
import { TableNode, TABLE_WIDTH } from "./TableNode";
import { NoteNode } from "./NoteNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { EdgeMarkerDefs } from "./EdgeMarkerDefs";

const nodeTypes = { table: TableNode, note: NoteNode };
const edgeTypes = { relationship: RelationshipEdge };
const DEFAULT_NOTE_SIZE = { width: 200, height: 140 };

function diagramToNodes(
  diagram: Pick<Diagram, "tables" | "notes">,
  existing: Node[] = [],
): Node[] {
  const prevById = new Map(existing.map((n) => [n.id, n]));
  const tableNodes: Node[] = diagram.tables.map((t) => {
    const prev = prevById.get(t.id);
    return {
      id: t.id,
      type: "table",
      position: t.position,
      data: {},
      selected: prev?.selected,
      dragging: prev?.dragging,
    };
  });
  const noteNodes: Node[] = diagram.notes.map((n) => {
    const prev = prevById.get(n.id);
    return {
      id: n.id,
      type: "note",
      position: n.position,
      width: n.size.width,
      height: n.size.height,
      data: {},
      selected: prev?.selected,
      dragging: prev?.dragging,
    };
  });
  return [...tableNodes, ...noteNodes];
}

function relationshipsToEdges(
  relationships: DiagramRelationship[],
  tables: DiagramTable[],
  existing: Edge[] = [],
): Edge[] {
  const tableById = new Map(tables.map((t) => [t.id, t]));
  const prevById = new Map(existing.map((e) => [e.id, e]));
  const edges: Edge[] = [];
  for (const r of relationships) {
    const sourceTable = tableById.get(r.sourceTableId);
    const targetTable = tableById.get(r.targetTableId);
    if (!sourceTable || !targetTable) continue;
    const { sourceSide, targetSide } = pickHandleSides(sourceTable, targetTable);
    const prev = prevById.get(r.id);
    edges.push({
      id: r.id,
      type: "relationship",
      source: r.sourceTableId,
      target: r.targetTableId,
      sourceHandle: makeHandleId(sourceSide, r.sourceColumnId),
      targetHandle: makeHandleId(targetSide, r.targetColumnId),
      data: {},
      selected: prev?.selected,
    });
  }
  return edges;
}

/**
 * Canvas Layer (masterplan section 15).
 *
 * Owns rendering, pan/zoom, selection and dragging via React Flow. Table,
 * note, and relationship data are derived from the diagram store; local
 * React Flow state mirrors them for smooth interaction and is committed
 * back to the store (as a single undoable step) once a gesture finishes.
 */
export function DiagramCanvas() {
  const grid = useDiagramStore((s) => s.diagram.grid);
  const viewport = useDiagramStore((s) => s.diagram.viewport);
  const updateViewport = useDiagramStore((s) => s.updateViewport);
  const tables = useDiagramStore((s) => s.diagram.tables);
  const notes = useDiagramStore((s) => s.diagram.notes);
  const relationships = useDiagramStore((s) => s.diagram.relationships);
  const diagramId = useDiagramStore((s) => s.diagram.meta.id);
  const commit = useDiagramStore((s) => s.commit);

  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const setPendingFocusId = useUIStore((s) => s.setPendingFocusId);
  const minimapVisible = useUIStore((s) => s.minimapVisible);

  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes] = useState<Node[]>(() => diagramToNodes({ tables, notes }));
  const [edges, setEdges] = useState<Edge[]>(() => relationshipsToEdges(relationships, tables));
  const [pendingSelectEdgeId, setPendingSelectEdgeId] = useState<string | null>(null);

  useEffect(() => {
    // React Flow needs external state (our diagram store) reconciled into
    // its own controlled nodes/edges arrays — this *is* "synchronizing
    // with an external system", the documented case for using an effect
    // this way, and is React Flow's own recommended integration pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes((prev) => diagramToNodes({ tables, notes }, prev));
  }, [tables, notes]);

  useEffect(() => {
    // Same as above, plus applying the one-shot "just created" selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEdges((prev) => {
      const next = relationshipsToEdges(relationships, tables, prev);
      return pendingSelectEdgeId
        ? next.map((e) => ({ ...e, selected: e.id === pendingSelectEdgeId }))
        : next;
    });
    if (pendingSelectEdgeId) setPendingSelectEdgeId(null);
  }, [relationships, tables, pendingSelectEdgeId]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onNodeDragStop = useCallback(
    (_: unknown, _node: Node, draggedNodes: Node[]) => {
      // draggedNodes covers every node that moved together in this drag
      // (a multi-selection drag moves more than just the one under the
      // cursor, and can mix tables and notes) — commit all of their
      // positions in a single undo step.
      commit((d) =>
        moveElements(
          d,
          draggedNodes.map((n) => ({ id: n.id, position: n.position })),
        ),
      );
    },
    [commit],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const source = connection.sourceHandle ? parseHandleId(connection.sourceHandle) : null;
      const target = connection.targetHandle ? parseHandleId(connection.targetHandle) : null;
      if (!source || !target) return;
      const id = nanoid();
      commit((d) =>
        createRelationship(
          d,
          { tableId: connection.source, columnId: source.columnId },
          { tableId: connection.target, columnId: target.columnId },
          id,
        ),
      );
      setPendingSelectEdgeId(id);
    },
    [commit],
  );

  const isValidConnection = useCallback((conn: Edge | Connection) => {
    const source = conn.sourceHandle ? parseHandleId(conn.sourceHandle) : null;
    const target = conn.targetHandle ? parseHandleId(conn.targetHandle) : null;
    if (!source || !target) return false;
    return source.columnId !== target.columnId;
  }, []);

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (activeTool !== "table" && activeTool !== "note") return;
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const id = nanoid();

      if (activeTool === "table") {
        const position = { x: flowPosition.x - TABLE_WIDTH / 2, y: flowPosition.y - 20 };
        commit((d) => createTable(d, position, id));
      } else {
        const position = {
          x: flowPosition.x - DEFAULT_NOTE_SIZE.width / 2,
          y: flowPosition.y - DEFAULT_NOTE_SIZE.height / 2,
        };
        commit((d) => createNote(d, position, id));
      }
      setPendingFocusId(id);
      setActiveTool("select");
    },
    [activeTool, screenToFlowPosition, commit, setPendingFocusId, setActiveTool],
  );

  // Delete/select-all/escape/tool-switch shortcuts need this component's
  // local nodes/edges (selection lives there) plus the diagram store, so
  // they're registered here rather than at a more "global" level.
  const handleDeleteSelected = useCallback(() => {
    const tableIds = new Set<string>();
    const noteIds = new Set<string>();
    for (const n of nodes) {
      if (!n.selected) continue;
      if (n.type === "note") noteIds.add(n.id);
      else tableIds.add(n.id);
    }
    const relationshipIds = new Set(edges.filter((e) => e.selected).map((e) => e.id));
    if (tableIds.size === 0 && noteIds.size === 0 && relationshipIds.size === 0) return;
    commit((d) => deleteElements(d, { tableIds, noteIds, relationshipIds }));
  }, [nodes, edges, commit]);

  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => (n.selected ? n : { ...n, selected: true })));
    setEdges((eds) => eds.map((e) => (e.selected ? e : { ...e, selected: true })));
  }, []);

  const handleEscape = useCallback(() => {
    // Blur whatever's focused — a table/column rename already unmounts
    // its input on Escape (InlineEditableText owns that), but a note's
    // textarea has no such modal state and would otherwise keep focus,
    // silently absorbing subsequent shortcuts as text-field input. This
    // also flushes any pending debounced note-text commit immediately.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActiveTool("select");
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
    setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)));
  }, [setActiveTool]);

  useKeyboardShortcuts([
    { key: "v", onTrigger: () => setActiveTool("select") },
    { key: "t", onTrigger: () => setActiveTool(activeTool === "table" ? "select" : "table") },
    { key: "n", onTrigger: () => setActiveTool(activeTool === "note" ? "select" : "note") },
    { key: "Delete", onTrigger: handleDeleteSelected },
    { key: "Backspace", onTrigger: handleDeleteSelected },
    { key: "a", mod: true, onTrigger: handleSelectAll },
    { key: "Escape", allowInEditable: true, onTrigger: handleEscape },
  ]);

  const handleMoveEnd = useCallback(
    (_: unknown, nextViewport: Viewport) => {
      updateViewport(nextViewport);
    },
    [updateViewport],
  );

  const isEmpty = tables.length === 0 && notes.length === 0;

  return (
    <div
      className={`h-full w-full ${activeTool === "table" || activeTool === "note" ? "cursor-crosshair" : ""}`}
    >
      {isEmpty && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden
        >
          <p
            className="text-[14px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            Press <kbd className="rounded border px-1 py-0.5 font-mono text-[11px]" style={{ borderColor: "var(--color-border)" }}>T</kbd> or click Table to start
          </p>
        </div>
      )}
      <EdgeMarkerDefs />
      <ReactFlow
        key={diagramId}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        onPaneClick={handlePaneClick}
        defaultViewport={{ x: viewport.x, y: viewport.y, zoom: viewport.zoom }}
        onMoveEnd={handleMoveEnd}
        minZoom={0.1}
        maxZoom={2.5}
        snapToGrid={grid.snapToGrid}
        snapGrid={[grid.size, grid.size]}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        zoomActivationKeyCode={["Meta", "Control"]}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        {grid.visible && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={grid.size}
            size={1.4}
            color="var(--color-grid-dot)"
          />
        )}
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.type === "note" ? "var(--color-border-strong)" : "var(--color-text-faint)")}
          maskColor="rgba(24,24,27,0.04)"
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            background: "var(--color-surface)",
            display: minimapVisible ? undefined : "none",
          }}
        />
      </ReactFlow>
    </div>
  );
}
