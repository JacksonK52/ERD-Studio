import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { GripVertical, Palette, Plus, Trash2 } from "lucide-react";
import {
  Handle,
  NodeResizeControl,
  Position,
  ResizeControlVariant,
  type NodeProps,
} from "@xyflow/react";
import { useDiagramStore } from "../../store/diagramStore";
import { useUIStore } from "../../store/uiStore";
import {
  addColumn,
  changeColumnType,
  deleteColumn,
  deleteTable,
  renameColumn,
  renameTable,
  reorderColumns,
  resizeTable,
  setTableColor,
  toggleColumnMeta,
} from "../../lib/diagramOperations";
import { makeHandleId } from "../../lib/handleId";
import { useClickOutside } from "../../lib/useClickOutside";
import { COLUMN_TYPES, type ColumnMeta, type ColumnType } from "../../types/diagram";
import { ColorSwatchPicker } from "../common/ColorSwatchPicker";
import { InlineEditableText } from "../common/InlineEditableText";

export const TABLE_WIDTH = 240;
const MIN_TABLE_WIDTH = 180;
const MAX_TABLE_WIDTH = 520;

const META_KEYS: Array<{ key: keyof ColumnMeta; label: string; title: string }> = [
  { key: "pk", label: "PK", title: "Primary key" },
  { key: "fk", label: "FK", title: "Foreign key" },
  { key: "nullable", label: "N", title: "Nullable" },
  { key: "unique", label: "U", title: "Unique" },
];

type DropTarget = { id: string; position: "before" | "after" } | null;

const handleStyle: CSSProperties = {
  width: 8,
  height: 8,
  background: "var(--color-surface)",
  border: "1.5px solid var(--color-text-faint)",
  borderRadius: "50%",
};

export function TableNode({ id: tableId, selected }: NodeProps) {
  const table = useDiagramStore((s) => s.diagram.tables.find((t) => t.id === tableId));
  const commit = useDiagramStore((s) => s.commit);

  const pendingFocusId = useUIStore((s) => s.pendingFocusId);
  const setPendingFocusId = useUIStore((s) => s.setPendingFocusId);
  const shouldAutoFocusName = pendingFocusId === tableId;

  useEffect(() => {
    if (shouldAutoFocusName) setPendingFocusId(null);
    // Only clear on mount — this is a one-shot hint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  useClickOutside(colorPickerRef, () => setColorPickerOpen(false));

  const resetDrag = useCallback(() => {
    setDragColumnId(null);
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(() => {
    if (!table || !dragColumnId || !dropTarget) {
      resetDrag();
      return;
    }
    const ids = table.columns.map((c) => c.id);
    const fromIndex = ids.indexOf(dragColumnId);
    if (fromIndex === -1) {
      resetDrag();
      return;
    }
    ids.splice(fromIndex, 1);
    let toIndex = ids.indexOf(dropTarget.id);
    if (toIndex === -1) toIndex = ids.length;
    else if (dropTarget.position === "after") toIndex += 1;
    ids.splice(toIndex, 0, dragColumnId);
    commit((d) => reorderColumns(d, tableId, ids));
    resetDrag();
  }, [table, dragColumnId, dropTarget, commit, tableId, resetDrag]);

  if (!table) return null;

  const width = table.width ?? TABLE_WIDTH;
  // Wider than the visible bar it contains, so the actual hit target is
  // easy to land on — the earlier 8px hairline was routinely missed,
  // dropping the click through to the table body and dragging it instead.
  const resizeHandleStyle: CSSProperties = { width: 14, background: "transparent", border: "none" };

  function handleResizeEnd(_: unknown, params: { x: number; y: number; width: number }) {
    commit((d) => resizeTable(d, tableId, params.width, { x: params.x, y: params.y }));
  }

  return (
    <div
      className="rounded-lg border transition-shadow"
      style={{
        width,
        background: "var(--color-surface)",
        borderWidth: table.color ? 1.5 : 1,
        borderColor: table.color ?? (selected ? "var(--color-accent)" : "var(--color-border)"),
        boxShadow: selected
          ? "0 0 0 1px var(--color-accent), 0 4px 10px rgba(0,0,0,0.06)"
          : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {selected && (
        <>
          <NodeResizeControl
            position="right"
            variant={ResizeControlVariant.Line}
            resizeDirection="horizontal"
            minWidth={MIN_TABLE_WIDTH}
            maxWidth={MAX_TABLE_WIDTH}
            style={resizeHandleStyle}
            className="group"
            onResizeEnd={handleResizeEnd}
          >
            <div className="flex h-full w-full items-center justify-center">
              <div
                className="h-8 w-1 rounded-full opacity-40 transition-opacity group-hover:opacity-100"
                style={{ background: "var(--color-accent)" }}
              />
            </div>
          </NodeResizeControl>
          <NodeResizeControl
            position="left"
            variant={ResizeControlVariant.Line}
            resizeDirection="horizontal"
            minWidth={MIN_TABLE_WIDTH}
            maxWidth={MAX_TABLE_WIDTH}
            style={resizeHandleStyle}
            className="group"
            onResizeEnd={handleResizeEnd}
          >
            <div className="flex h-full w-full items-center justify-center">
              <div
                className="h-8 w-1 rounded-full opacity-40 transition-opacity group-hover:opacity-100"
                style={{ background: "var(--color-accent)" }}
              />
            </div>
          </NodeResizeControl>
        </>
      )}

      {/* Header */}
      <div
        className="group/header relative flex items-center gap-1 rounded-t-[7px] border-b px-2.5 py-1.5"
        style={{
          borderColor: table.color ?? "var(--color-border)",
          background: table.color
            ? `color-mix(in srgb, ${table.color} 14%, var(--color-surface))`
            : undefined,
        }}
      >
        <InlineEditableText
          value={table.name}
          autoFocus={shouldAutoFocusName}
          onCommit={(name) => commit((d) => renameTable(d, tableId, name))}
          className="min-w-0 flex-1 truncate text-[13px] font-medium"
          inputClassName="w-full min-w-0 rounded border px-1 py-0.5 text-[13px] font-medium outline-none"
        />
        <div ref={colorPickerRef} className="relative">
          <button
            type="button"
            title="Table color"
            onClick={() => setColorPickerOpen((v) => !v)}
            className="nodrag nopan flex shrink-0 items-center justify-center rounded p-0.5 opacity-0 transition-opacity group-hover/header:opacity-100"
            style={{ opacity: colorPickerOpen ? 1 : undefined }}
          >
            {table.color ? (
              <span
                className="block h-3 w-3 rounded-full"
                style={{ background: table.color }}
              />
            ) : (
              <Palette
                size={13}
                strokeWidth={1.75}
                className="text-[color:var(--color-text-faint)]"
              />
            )}
          </button>
          {colorPickerOpen && (
            <ColorSwatchPicker
              value={table.color}
              onChange={(color) => {
                commit((d) => setTableColor(d, tableId, color));
                setColorPickerOpen(false);
              }}
            />
          )}
        </div>
        <button
          type="button"
          title="Delete table"
          onClick={() => commit((d) => deleteTable(d, tableId))}
          className="nodrag nopan shrink-0 rounded p-0.5 text-[color:var(--color-text-faint)] opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover/header:opacity-100"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      </div>

      {/* Columns */}
      <div>
        {table.columns.map((column) => (
          <div
            key={column.id}
            className="group/row relative flex items-center gap-1 border-t border-b px-1.5 py-1"
            style={{
              borderTopColor:
                dropTarget?.id === column.id && dropTarget.position === "before"
                  ? "var(--color-accent)"
                  : "transparent",
              borderBottomColor:
                dropTarget?.id === column.id && dropTarget.position === "after"
                  ? "var(--color-accent)"
                  : "transparent",
              opacity: dragColumnId === column.id ? 0.4 : 1,
            }}
            onDragOver={(e: DragEvent<HTMLDivElement>) => {
              if (!dragColumnId) return;
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const after = e.clientY - rect.top > rect.height / 2;
              setDropTarget({ id: column.id, position: after ? "after" : "before" });
            }}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              handleDrop();
            }}
          >
            <Handle
              type="source"
              position={Position.Left}
              id={makeHandleId("l", column.id)}
              style={{ ...handleStyle, left: -4 }}
              className="opacity-0 transition-opacity group-hover/row:opacity-100"
            />
            <Handle
              type="source"
              position={Position.Right}
              id={makeHandleId("r", column.id)}
              style={{ ...handleStyle, right: -4 }}
              className="opacity-0 transition-opacity group-hover/row:opacity-100"
            />
            <span
              draggable
              onDragStart={(e: DragEvent<HTMLSpanElement>) => {
                e.dataTransfer.effectAllowed = "move";
                setDragColumnId(column.id);
              }}
              onDragEnd={resetDrag}
              title="Drag to reorder"
              className="nodrag nopan shrink-0 cursor-grab text-[color:var(--color-text-faint)] opacity-0 group-hover/row:opacity-100"
            >
              <GripVertical size={12} />
            </span>

            <InlineEditableText
              value={column.name}
              onCommit={(name) => commit((d) => renameColumn(d, tableId, column.id, name))}
              className="min-w-0 flex-1 truncate font-mono text-[11.5px]"
              inputClassName="w-full min-w-0 rounded border px-1 py-0.5 font-mono text-[11.5px] outline-none"
            />

            <select
              value={column.type}
              onChange={(e) =>
                commit((d) =>
                  changeColumnType(d, tableId, column.id, e.target.value as ColumnType),
                )
              }
              className="nodrag nopan shrink-0 cursor-pointer rounded bg-transparent font-mono text-[10.5px] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] focus:outline-none"
            >
              {COLUMN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <div className="flex shrink-0 items-center gap-0.5">
              {META_KEYS.map(({ key, label, title }) => (
                <button
                  key={key}
                  type="button"
                  title={title}
                  onClick={() => commit((d) => toggleColumnMeta(d, tableId, column.id, key))}
                  className={[
                    "nodrag nopan h-4 min-w-[16px] rounded px-1 text-[9px] font-semibold leading-4 transition-opacity",
                    column.meta[key]
                      ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                      : "text-[color:var(--color-text-faint)] opacity-0 hover:bg-zinc-100 group-hover/row:opacity-100",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              title="Delete column"
              onClick={() => commit((d) => deleteColumn(d, tableId, column.id))}
              className="nodrag nopan shrink-0 rounded p-0.5 text-[color:var(--color-text-faint)] opacity-0 hover:bg-red-50 hover:text-red-500 group-hover/row:opacity-100"
            >
              <Trash2 size={11} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>

      {/* Add column */}
      <button
        type="button"
        onClick={() => commit((d) => addColumn(d, tableId))}
        className="nodrag nopan flex w-full items-center gap-1 rounded-b-[7px] border-t px-2.5 py-1 text-[11px] text-[color:var(--color-text-faint)] hover:bg-zinc-50 hover:text-[color:var(--color-text-muted)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Plus size={12} strokeWidth={1.75} /> Add column
      </button>
    </div>
  );
}
