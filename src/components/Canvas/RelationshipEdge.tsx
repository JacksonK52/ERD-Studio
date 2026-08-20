import { useRef, useState } from "react";
import { Palette, Trash2 } from "lucide-react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import { useDiagramStore } from "../../store/diagramStore";
import {
  deleteRelationship,
  setRelationshipColor,
  updateRelationshipEnd,
} from "../../lib/diagramOperations";
import type { CardinalityEnd } from "../../types/diagram";
import { markerUrlFor } from "../../lib/markerId";
import { useClickOutside } from "../../lib/useClickOutside";
import { ColorSwatchPicker } from "../common/ColorSwatchPicker";

function CardinalityToggle({
  end,
  onChange,
}: {
  end: CardinalityEnd;
  onChange: (patch: Partial<CardinalityEnd>) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded bg-zinc-50 px-1 py-0.5">
      <button
        type="button"
        title="Toggle one / many"
        onClick={() => onChange({ multiplicity: end.multiplicity === "one" ? "many" : "one" })}
        className="w-3.5 font-mono text-[10px] font-semibold leading-none text-[color:var(--color-text)] hover:text-[color:var(--color-accent)]"
      >
        {end.multiplicity === "one" ? "1" : "N"}
      </button>
      <button
        type="button"
        title="Toggle mandatory / optional"
        onClick={() =>
          onChange({ optionality: end.optionality === "mandatory" ? "optional" : "mandatory" })
        }
        className="text-[11px] leading-none text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent)]"
      >
        {end.optionality === "mandatory" ? "●" : "○"}
      </button>
    </div>
  );
}

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const relationship = useDiagramStore((s) => s.diagram.relationships.find((r) => r.id === id));
  const commit = useDiagramStore((s) => s.commit);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  useClickOutside(colorPickerRef, () => setColorPickerOpen(false));

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  if (!relationship) return null;

  const strokeColor =
    relationship.color ?? (selected ? "var(--color-accent)" : "var(--color-border-strong)");

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerUrlFor(relationship.source)}
        markerEnd={markerUrlFor(relationship.target)}
        style={{
          stroke: strokeColor,
          color: strokeColor,
          strokeWidth: selected ? 1.75 : 1.25,
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute flex items-center gap-1 rounded-md border px-1.5 py-1 shadow-md"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              pointerEvents: "all",
            }}
          >
            <CardinalityToggle
              end={relationship.source}
              onChange={(patch) => commit((d) => updateRelationshipEnd(d, id, "source", patch))}
            />
            <span className="text-[color:var(--color-text-faint)]">—</span>
            <CardinalityToggle
              end={relationship.target}
              onChange={(patch) => commit((d) => updateRelationshipEnd(d, id, "target", patch))}
            />
            <div ref={colorPickerRef} className="relative ml-1">
              <button
                type="button"
                title="Relationship color"
                onClick={() => setColorPickerOpen((v) => !v)}
                className="flex shrink-0 items-center justify-center rounded p-0.5"
              >
                {relationship.color ? (
                  <span
                    className="block h-3 w-3 rounded-full"
                    style={{ background: relationship.color }}
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
                  value={relationship.color}
                  onChange={(color) => {
                    commit((d) => setRelationshipColor(d, id, color));
                    setColorPickerOpen(false);
                  }}
                />
              )}
            </div>
            <button
              type="button"
              title="Delete relationship"
              onClick={() => commit((d) => deleteRelationship(d, id))}
              className="rounded p-0.5 text-[color:var(--color-text-faint)] hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={12} strokeWidth={1.75} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
