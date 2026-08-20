import { useEffect, useRef, useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { Palette, Trash2 } from "lucide-react";
import { useDiagramStore } from "../../store/diagramStore";
import { useUIStore } from "../../store/uiStore";
import { deleteNote, resizeNote, setNoteColor, updateNoteText } from "../../lib/diagramOperations";
import { useClickOutside } from "../../lib/useClickOutside";
import { useDeferredFocus } from "../../lib/useDeferredFocus";
import { ColorSwatchPicker } from "../common/ColorSwatchPicker";

const COMMIT_DEBOUNCE_MS = 500;
const MIN_WIDTH = 140;
const MIN_HEIGHT = 90;

export function NoteNode({ id: noteId, selected }: NodeProps) {
  const note = useDiagramStore((s) => s.diagram.notes.find((n) => n.id === noteId));
  const commit = useDiagramStore((s) => s.commit);

  const pendingFocusId = useUIStore((s) => s.pendingFocusId);
  const setPendingFocusId = useUIStore((s) => s.setPendingFocusId);
  const shouldAutoFocus = pendingFocusId === noteId;

  useEffect(() => {
    if (shouldAutoFocus) setPendingFocusId(null);
    // Only clear on mount — this is a one-shot hint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useDeferredFocus(textareaRef, shouldAutoFocus);

  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState(note?.text ?? "");
  const debounceRef = useRef<number | null>(null);

  // Keep local draft in sync with the store whenever we're not actively
  // typing (e.g. an undo/redo happened) — while focused, local draft is
  // authoritative until blur or the debounce commits it.
  useEffect(() => {
    if (!isFocused && note) setDraft(note.text);
  }, [note, isFocused]);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  useClickOutside(colorPickerRef, () => setColorPickerOpen(false));

  if (!note) return null;

  function scheduleCommit(value: string) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      commit((d) => updateNoteText(d, noteId, value));
      debounceRef.current = null;
    }, COMMIT_DEBOUNCE_MS);
  }

  function flushCommit(value: string) {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (note && value !== note.text) commit((d) => updateNoteText(d, noteId, value));
  }

  const background = note.color
    ? `color-mix(in srgb, ${note.color} 14%, var(--color-surface))`
    : "var(--color-surface)";
  const borderColor = selected
    ? "var(--color-accent)"
    : note.color
      ? `color-mix(in srgb, ${note.color} 45%, var(--color-surface))`
      : "var(--color-border)";

  return (
    <div
      className="flex h-full w-full flex-col rounded-lg border transition-shadow"
      style={{
        background,
        borderColor,
        boxShadow: selected
          ? "0 0 0 1px var(--color-accent), 0 4px 10px rgba(0,0,0,0.06)"
          : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: "var(--color-surface)",
          border: "1.5px solid var(--color-accent)",
        }}
        lineStyle={{ borderColor: "var(--color-accent)" }}
        onResizeEnd={(_, params) => {
          commit((d) =>
            resizeNote(
              d,
              noteId,
              { width: params.width, height: params.height },
              { x: params.x, y: params.y },
            ),
          );
        }}
      />

      <div className="group/header flex shrink-0 items-center justify-end gap-1 px-1.5 pt-1.5">
        <div ref={colorPickerRef} className="relative">
          <button
            type="button"
            title="Note color"
            onClick={() => setColorPickerOpen((v) => !v)}
            className="nodrag nopan flex shrink-0 items-center justify-center rounded p-0.5 opacity-0 transition-opacity group-hover/header:opacity-100"
            style={{ opacity: colorPickerOpen ? 1 : undefined }}
          >
            {note.color ? (
              <span className="block h-3 w-3 rounded-full" style={{ background: note.color }} />
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
              value={note.color}
              onChange={(color) => {
                commit((d) => setNoteColor(d, noteId, color));
                setColorPickerOpen(false);
              }}
            />
          )}
        </div>
        <button
          type="button"
          title="Delete note"
          onClick={() => commit((d) => deleteNote(d, noteId))}
          className="nodrag nopan shrink-0 rounded p-0.5 text-[color:var(--color-text-faint)] opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover/header:opacity-100"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={draft}
        placeholder="Note..."
        onChange={(e) => {
          setDraft(e.target.value);
          scheduleCommit(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          flushCommit(e.target.value);
        }}
        className="nodrag nopan min-h-0 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[12.5px] leading-snug outline-none placeholder:text-[color:var(--color-text-faint)]"
        style={{ color: "var(--color-text)" }}
      />
    </div>
  );
}
