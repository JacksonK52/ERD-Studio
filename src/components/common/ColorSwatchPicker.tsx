import { forwardRef } from "react";
import { SWATCH_COLORS } from "../../lib/colors";

interface ColorSwatchPickerProps {
  value: string | null | undefined;
  onChange: (color: string | null) => void;
}

export const ColorSwatchPicker = forwardRef<HTMLDivElement, ColorSwatchPickerProps>(
  function ColorSwatchPicker({ value, onChange }, ref) {
    return (
      <div
        ref={ref}
        className="nodrag nopan absolute top-full left-0 mt-1 flex items-center gap-1 rounded-md border p-1.5 shadow-md"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          // Higher than React Flow's own internal z-indices (nodes can reach
          // z-index 1000+ when selected/elevated) so the popover never gets
          // clipped by a neighboring node it happens to overlap.
          zIndex: 1002,
        }}
      >
        <button
          type="button"
          title="No color"
          onClick={() => onChange(null)}
          className="h-4 w-4 shrink-0 rounded-full border border-dashed"
          style={{ borderColor: "var(--color-text-faint)" }}
        />
        {SWATCH_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            onClick={() => onChange(c.hex)}
            className="h-4 w-4 shrink-0 rounded-full"
            style={{
              background: c.hex,
              boxShadow:
                value === c.hex
                  ? `0 0 0 2px var(--color-surface), 0 0 0 3.5px ${c.hex}`
                  : undefined,
            }}
          />
        ))}
      </div>
    );
  },
);
