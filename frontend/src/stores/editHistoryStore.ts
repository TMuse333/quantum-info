import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EditType = 'text' | 'color' | 'theme' | 'structural' | 'manual';

export interface EditHistoryEntry {
  id: string;
  timestamp: number;
  type: EditType;
  status?: 'pending' | 'success' | 'failed'; // Track edit status

  // Component info (if applicable)
  componentId?: string;
  componentType?: string;
  pageSlug?: string;

  // Change details
  changes: {
    // For text/color edits
    prop?: string;
    oldValue?: any;
    newValue?: any;

    // For multiple prop changes
    props?: Record<string, { old: any; new: any }>;

    // For structural edits
    files?: Array<{
      path: string;
      action: 'create' | 'modify' | 'delete';
    }>;

    // For theme edits
    theme?: {
      primary?: { old: string; new: string };
      secondary?: { old: string; new: string };
      text?: { old: string; new: string };
      background?: { old: string; new: string };
      bgLayout?: { old: any; new: any };
    };
  };

  // Metadata
  metadata?: {
    prompt?: string; // User's original request
    llmResponse?: string; // LLM's response
    editMode?: 'single' | 'page-wide';
    source?: 'ai-assistant' | 'manual' | 'claude-code';
    tokensUsed?: number;
    model?: string;
  };
}

interface EditHistoryStore {
  history: EditHistoryEntry[];
  lastSavedTimestamp: number | null;
  addEdit: (entry: Omit<EditHistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  markAsSaved: () => void;
  getHistoryByType: (type: EditType) => EditHistoryEntry[];
  getHistoryByComponent: (componentId: string) => EditHistoryEntry[];
  getHistorySince: (timestamp: number) => EditHistoryEntry[];
  getUnsavedEdits: () => EditHistoryEntry[];
}

export const useEditHistoryStore = create<EditHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      lastSavedTimestamp: null,
      
      addEdit: (entry) => {
        const newEntry: EditHistoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        
        set((state) => ({
          history: [...state.history, newEntry].slice(-1000), // Keep last 1000 entries
        }));
      },
      
      clearHistory: () => set({ history: [], lastSavedTimestamp: null }),
      
      markAsSaved: () => set({ lastSavedTimestamp: Date.now() }),
      
      getUnsavedEdits: () => {
        const state = get();
        if (!state.lastSavedTimestamp) {
          return state.history; // All edits are unsaved if never saved
        }
        return state.history.filter(entry => entry.timestamp > state.lastSavedTimestamp!);
      },
      
      getHistoryByType: (type) => {
        return get().history.filter((entry) => entry.type === type);
      },
      
      getHistoryByComponent: (componentId) => {
        return get().history.filter((entry) => entry.componentId === componentId);
      },
      
      getHistorySince: (timestamp) => {
        return get().history.filter((entry) => entry.timestamp >= timestamp);
      },
    }),
    {
      name: 'edit-history-storage',
      // Optional: only persist last 500 entries to avoid localStorage bloat
      partialize: (state) => ({
        history: state.history.slice(-500),
        lastSavedTimestamp: state.lastSavedTimestamp,
      }),
    }
  )
);

