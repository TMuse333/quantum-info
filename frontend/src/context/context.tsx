"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { EditableComponent, LlmTextOutput, BaseColorProps } from '@/types/editorial';
// ✅ Type-only import

interface NavLink {
  name: string;
  destination: string;
  scroll?: boolean;
}

export type PriceFilter = 'all' | 199 | 499 | 799;

interface StructuralChange {
  files: Array<{
    path: string;
    changes: string;
    diff: string;
    action: "modify" | "create" | "delete";
  }>;
  preview: string;
  originalPrompt: string;
  explanation: string;
}

interface RecentOpenAIEdit {
  prompt: string;
  type: "text" | "color";
  timestamp: number;
}

interface FileChangeHistory {
  timestamp: number;
  files: Array<{
    path: string;
    originalContent: string | null; // null if file was created
    newContent: string;
    action: "create" | "modify" | "delete";
  }>;
}

export interface ComponentEditorContextValue {
  currentComponent: EditableComponent | null;
  setCurrentComponent: (component: EditableComponent | null) => void;
  currentColorEdits: Partial<BaseColorProps> | null;
  setCurrentColorEdits: (colors: Partial<BaseColorProps> | null) => void;
  assistantMessage: string;
  setAssistantMessage: React.Dispatch<React.SetStateAction<string>>;
  assistantIsEditing: boolean;
  setAssistantIsEditing: (val: boolean) => void;
  LlmCurrentTextOutput: Partial<LlmTextOutput> | null;
  setLlmCurrentTextOutput: React.Dispatch<React.SetStateAction<Partial<LlmTextOutput> | null>>;
  editorMode: boolean;
  setEditorMode: React.Dispatch<React.SetStateAction<boolean>>;
  navLinks: NavLink[];
  setNavLinks: React.Dispatch<React.SetStateAction<NavLink[]>>;
  selectedPrice: PriceFilter;
  setSelectedPrice: React.Dispatch<React.SetStateAction<PriceFilter>>;
  currentPrice: number | null;
  setCurrentPrice: React.Dispatch<React.SetStateAction<number | null>>;
  // Structural changes (Claude Code)
  previewStructuralChanges: StructuralChange | null;
  setPreviewStructuralChanges: React.Dispatch<React.SetStateAction<StructuralChange | null>>;
  // Recent OpenAI edits for commit messages
  recentOpenAIEdit: RecentOpenAIEdit | null;
  setRecentOpenAIEdit: React.Dispatch<React.SetStateAction<RecentOpenAIEdit | null>>;
  // File change history for undo
  fileChangeHistory: FileChangeHistory[];
  setFileChangeHistory: React.Dispatch<React.SetStateAction<FileChangeHistory[]>>;
}

const ComponentEditorContext = createContext<ComponentEditorContextValue | undefined>(undefined);

export const ComponentEditorProvider = ({ children }: { children: ReactNode }) => {
  const [currentComponent, setCurrentComponent] = useState<EditableComponent | null>(null);
  const [currentColorEdits, setCurrentColorEdits] = useState<Partial<BaseColorProps> | null>(null);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantIsEditing, setAssistantIsEditing] = useState(false);
  const [LlmCurrentTextOutput, setLlmCurrentTextOutput] = useState<Partial<LlmTextOutput> | null>(null);
  const [editorMode, setEditorMode] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>(199);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previewStructuralChanges, setPreviewStructuralChanges] = useState<StructuralChange | null>(null);
  const [recentOpenAIEdit, setRecentOpenAIEdit] = useState<RecentOpenAIEdit | null>(null);
  const [fileChangeHistory, setFileChangeHistory] = useState<FileChangeHistory[]>([]);

  // ✅ Lazy load the registry on client side only
  // const [componentRegistry, setComponentRegistry] = useState<Record<ComponentType, ComponentRegistryEntry> | null>(null);
  const isMountedRef = useRef(true);

  // Load registry on mount (client-side only)
  // useEffect(() => {
  //   // Set mounted flag
  //   isMountedRef.current = true;

  //   if (typeof window !== 'undefined' && !componentRegistry) {
  //     import("@/types/registry/mainRegistry").then(({ COMPONENT_REGISTRY }) => {
  //       // Only update state if component is still mounted
  //       if (isMountedRef.current) {
  //         // @ts-expect-error the registry is defined of all typed components and there is only one
  //         setComponentRegistry(COMPONENT_REGISTRY);
  //       }
  //     }).catch((error) => {
  //       console.error("Failed to load component registry:", error);
  //     });
  //   }

  //   // Cleanup: mark as unmounted
  //   return () => {
  //     isMountedRef.current = false;
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // Only run once on mount

  // // Fallback empty registry while loading
  // const safeRegistry = componentRegistry || ({} as Record<ComponentType, ComponentRegistryEntry>);

  return (
    <ComponentEditorContext.Provider
      value={{
        currentComponent,
        setCurrentComponent,
        currentColorEdits,
        setCurrentColorEdits,
        assistantMessage,
        setAssistantMessage,
        assistantIsEditing,
        setAssistantIsEditing,
        LlmCurrentTextOutput,
        setLlmCurrentTextOutput,
        editorMode,
        setEditorMode,
        navLinks,
        setNavLinks,
        selectedPrice,
        setSelectedPrice,
        currentPrice,
        setCurrentPrice,
        previewStructuralChanges,
        setPreviewStructuralChanges,
        recentOpenAIEdit,
        setRecentOpenAIEdit,
        fileChangeHistory,
        setFileChangeHistory,
      }}
    >
      {children}
    </ComponentEditorContext.Provider>
  );
};

export const useComponentEditor = () => {
  const context = useContext(ComponentEditorContext);
  if (!context) throw new Error("useComponentEditor must be used within a ComponentEditorProvider");
  return context;
};
