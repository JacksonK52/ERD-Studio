import { useRef, useState } from "react";
import { Download, FileImage, FileText, Loader2 } from "lucide-react";
import { useDiagramStore } from "../../store/diagramStore";
import { useToastStore } from "../../store/toastStore";
import { useClickOutside } from "../../lib/useClickOutside";
import { exportAsPDF, exportAsPNG, exportAsSVG } from "../../lib/export/exportDiagram";
import { ToolbarButton } from "./ToolbarButton";

type ExportFormat = "svg" | "png" | "pdf";

export function ExportMenu() {
  const diagram = useDiagramStore((s) => s.diagram);
  const pushToast = useToastStore((s) => s.push);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpen(false));

  const hasContent = diagram.tables.length > 0 || diagram.notes.length > 0;

  async function handleExport(format: ExportFormat) {
    setPending(format);
    try {
      if (format === "svg") exportAsSVG(diagram);
      else if (format === "png") await exportAsPNG(diagram);
      else await exportAsPDF(diagram);
      setOpen(false);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <ToolbarButton
        icon={<Download size={16} strokeWidth={1.75} />}
        label={hasContent ? "Export" : "Nothing to export yet"}
        active={open}
        disabled={!hasContent}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-md border py-1 shadow-md"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <ExportMenuItem
            icon={<FileText size={14} strokeWidth={1.75} />}
            label="SVG"
            pending={pending === "svg"}
            disabled={pending !== null}
            onClick={() => handleExport("svg")}
          />
          <ExportMenuItem
            icon={<FileImage size={14} strokeWidth={1.75} />}
            label="PNG"
            pending={pending === "png"}
            disabled={pending !== null}
            onClick={() => handleExport("png")}
          />
          <ExportMenuItem
            icon={<FileText size={14} strokeWidth={1.75} />}
            label="PDF"
            pending={pending === "pdf"}
            disabled={pending !== null}
            onClick={() => handleExport("pdf")}
          />
        </div>
      )}
    </div>
  );
}

function ExportMenuItem({
  icon,
  label,
  pending,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[color:var(--color-text)] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}
