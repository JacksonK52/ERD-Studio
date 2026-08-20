import { create } from "zustand";

export type Tool = "select" | "table" | "note";

interface UIState {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  /**
   * Id of a just-created table or note to auto-focus for immediate
   * editing, so the create -> name/text workflow doesn't need an extra
   * click. Cleared by the node itself right after it mounts and picks
   * this up.
   */
  pendingFocusId: string | null;
  setPendingFocusId: (id: string | null) => void;

  /** Ephemeral view preference, not part of the saved diagram (masterplan
   * treats grid as diagram data since it affects snapping; the mini-map
   * is purely a navigation aid, so it resets to visible each session). */
  minimapVisible: boolean;
  toggleMinimap: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  pendingFocusId: null,
  setPendingFocusId: (id) => set({ pendingFocusId: id }),

  minimapVisible: true,
  toggleMinimap: () => set((s) => ({ minimapVisible: !s.minimapVisible })),
}));
