import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useReactFlow, useStore } from "@xyflow/react";
import { ToolbarButton } from "./ToolbarButton";

export function ZoomControl() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton
        icon={<ZoomOut size={16} strokeWidth={1.75} />}
        label="Zoom out"
        onClick={() => zoomOut({ duration: 150 })}
      />
      <button
        type="button"
        onClick={() => fitView({ duration: 200 })}
        title="Reset zoom to fit"
        className="w-11 rounded-md px-1 py-1 text-center font-mono text-xs tabular-nums text-[color:var(--color-text-muted)] hover:bg-zinc-100 hover:text-[color:var(--color-text)]"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolbarButton
        icon={<ZoomIn size={16} strokeWidth={1.75} />}
        label="Zoom in"
        onClick={() => zoomIn({ duration: 150 })}
      />
      <ToolbarButton
        icon={<Maximize2 size={15} strokeWidth={1.75} />}
        label="Fit to screen"
        onClick={() => fitView({ duration: 200 })}
      />
    </div>
  );
}
