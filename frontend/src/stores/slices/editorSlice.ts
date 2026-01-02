import { StateCreator } from "zustand";

/**
 * EditorSlice - Manages editor UI state
 *
 * Responsibilities:
 * - Current page navigation
 * - Editor mode toggle
 * - Component selection
 * - UI-only state (no data mutations)
 */

export interface EditorSlice {
  // ===== STATE =====
  currentPageSlug: string;
  editorMode: boolean;
  selectedComponentId: string | null;

  // ===== ACTIONS =====
  setCurrentPageSlug: (slug: string) => void;
  setEditorMode: (mode: boolean) => void;
  setSelectedComponentId: (id: string | null) => void;
  toggleEditorMode: () => void;
}

export const createEditorSlice: StateCreator<
  EditorSlice,
  [],
  [],
  EditorSlice
> = (set) => ({
  // ===== INITIAL STATE =====
  currentPageSlug: 'index',
  editorMode: false,
  selectedComponentId: null,

  // ===== ACTIONS =====
  setCurrentPageSlug: (slug) => {
    console.log("📄 [editorSlice] Setting current page:", slug);
    set({ currentPageSlug: slug, selectedComponentId: null }); // Clear selection when changing pages
  },

  setEditorMode: (mode) => {
    console.log("✏️ [editorSlice] Setting editor mode:", mode);
    set({ editorMode: mode });

    // Clear selection when exiting editor mode
    if (!mode) {
      set({ selectedComponentId: null });
    }
  },

  setSelectedComponentId: (id) => {
    console.log("🎯 [editorSlice] Selecting component:", id);
    set({ selectedComponentId: id });
  },

  toggleEditorMode: () => {
    set((state) => {
      const newMode = !state.editorMode;
      console.log("🔄 [editorSlice] Toggling editor mode:", newMode);

      return {
        editorMode: newMode,
        selectedComponentId: newMode ? state.selectedComponentId : null,
      };
    });
  },
});
