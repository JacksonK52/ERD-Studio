import { useCallback, useState } from "react";
import {
  FolderOpen,
  Grid3x3,
  HelpCircle,
  Map,
  MousePointer2,
  Redo2,
  Save,
  StickyNote,
  Table2,
  Undo2,
} from "lucide-react";
import { useDiagramStore } from "../../store/diagramStore";
import { useUIStore } from "../../store/uiStore";
import { useToastStore } from "../../store/toastStore";
import { openProjectFile, saveProjectFile } from "../../lib/projectFile";
import { useKeyboardShortcuts } from "../../lib/useKeyboardShortcuts";
import { ShortcutsHelp } from "../common/ShortcutsHelp";
import { ExportMenu } from "./ExportMenu";
import { ToolbarButton, ToolbarDivider } from "./ToolbarButton";
import { ZoomControl } from "./ZoomControl";

export function Toolbar() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  const grid = useDiagramStore((s) => s.diagram.grid);
  const updateGrid = useDiagramStore((s) => s.updateGrid);
  const undo = useDiagramStore((s) => s.undo);
  const redo = useDiagramStore((s) => s.redo);
  const canUndo = useDiagramStore((s) => s.past.length > 0);
  const canRedo = useDiagramStore((s) => s.future.length > 0);

  const minimapVisible = useUIStore((s) => s.minimapVisible);
  const toggleMinimap = useUIStore((s) => s.toggleMinimap);

  const diagram = useDiagramStore((s) => s.diagram);
  const loadDiagram = useDiagramStore((s) => s.loadDiagram);
  const pushToast = useToastStore((s) => s.push);

  const [helpOpen, setHelpOpen] = useState(false);

  const handleSave = useCallback(() => {
    saveProjectFile(diagram);
  }, [diagram]);

  const handleOpen = useCallback(async () => {
    try {
      const opened = await openProjectFile();
      if (opened) loadDiagram(opened);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Couldn't open that file.");
    }
  }, [loadDiagram, pushToast]);

  useKeyboardShortcuts([
    { key: "z", mod: true, shift: false, onTrigger: () => canUndo && undo() },
    { key: "z", mod: true, shift: true, onTrigger: () => canRedo && redo() },
    { key: "s", mod: true, allowInEditable: true, onTrigger: handleSave },
    { key: "o", mod: true, allowInEditable: true, onTrigger: handleOpen },
    { key: "?", onTrigger: () => setHelpOpen((v) => !v) },
  ]);

  return (
    <div
      className="flex h-12 shrink-0 items-center gap-1 border-b px-2"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2 pr-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--color-accent)" }}
          aria-hidden
        />
        <span className="text-sm font-medium tracking-tight">ERD Studio</span>
      </div>

      <ToolbarDivider />

      <ToolbarButton
        icon={<MousePointer2 size={16} strokeWidth={1.75} />}
        label="Select"
        shortcut="V"
        active={activeTool === "select"}
        onClick={() => setActiveTool("select")}
      />
      <ToolbarButton
        icon={<Table2 size={16} strokeWidth={1.75} />}
        label={activeTool === "table" ? "Click the canvas to place the table" : "Add table"}
        shortcut="T"
        active={activeTool === "table"}
        onClick={() => setActiveTool(activeTool === "table" ? "select" : "table")}
      />
      <ToolbarButton
        icon={<StickyNote size={16} strokeWidth={1.75} />}
        label={activeTool === "note" ? "Click the canvas to place the note" : "Add note"}
        shortcut="N"
        active={activeTool === "note"}
        onClick={() => setActiveTool(activeTool === "note" ? "select" : "note")}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={<Undo2 size={16} strokeWidth={1.75} />}
        label="Undo"
        shortcut="Ctrl+Z"
        disabled={!canUndo}
        onClick={undo}
      />
      <ToolbarButton
        icon={<Redo2 size={16} strokeWidth={1.75} />}
        label="Redo"
        shortcut="Ctrl+Shift+Z"
        disabled={!canRedo}
        onClick={redo}
      />

      <ToolbarDivider />

      <ZoomControl />

      <ToolbarButton
        icon={<Grid3x3 size={16} strokeWidth={1.75} />}
        label="Toggle grid"
        active={grid.visible}
        onClick={() =>
          updateGrid({ visible: !grid.visible, snapToGrid: !grid.visible })
        }
      />
      <ToolbarButton
        icon={<Map size={16} strokeWidth={1.75} />}
        label="Toggle mini-map"
        active={minimapVisible}
        onClick={toggleMinimap}
      />

      <div className="flex-1" />

      <ToolbarButton
        icon={<Save size={16} strokeWidth={1.75} />}
        label="Save"
        shortcut="Ctrl+S"
        onClick={handleSave}
      />
      <ToolbarButton
        icon={<FolderOpen size={16} strokeWidth={1.75} />}
        label="Open"
        shortcut="Ctrl+O"
        onClick={handleOpen}
      />
      <ExportMenu />

      <ToolbarDivider />

      <ToolbarButton
        icon={<HelpCircle size={16} strokeWidth={1.75} />}
        label="Keyboard shortcuts"
        shortcut="?"
        active={helpOpen}
        onClick={() => setHelpOpen((v) => !v)}
      />

      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
