// utils/handleComponentClick.ts
import axios from "axios";
// import { EditableComponent, LlmTextOutput,
//  BaseColorProps, BaseTextProps,
// WebsitePage } from "../types/types";

import { BaseColorProps, BaseTextProps, EditableComponent, LlmTextOutput, WebsitePage,
BaseArrayItem} from '@/types/editorial';

import { EditableField } from '@/types/editorial';
import React, {useEffect, useRef, useMemo} from 'react'
import useWebsiteStore from "@/stores/websiteStore";
import { useEditHistoryStore } from "@/stores/editHistoryStore";



type HandleClickParams = {
  // isSelected:boolean
  componentDetails: EditableComponent;
  setCurrentComponent: (comp: EditableComponent | null) => void;
  setAssistantMessage: React.Dispatch<React.SetStateAction<string>>;
  currentComponent: EditableComponent,
  // onInitColors?: (colors: Partial<BaseColorProps>) => void;
};





// ✅ Guard to prevent multiple simultaneous API calls
let isFetchingComponentIntro = false;
let lastFetchedComponent: string | null = null;

export const handleComponentClick = async ({
  componentDetails,
  setCurrentComponent,
  setAssistantMessage,
  currentComponent,

}: HandleClickParams) => {

  // ✅ GUARD: Skip if already the current component
  if (currentComponent && currentComponent.name === componentDetails.name) {
    return;
  }

  // ✅ GUARD: Skip if already fetching for this component
  if (isFetchingComponentIntro && lastFetchedComponent === componentDetails.name) {
    console.log('⏭️ [handleComponentClick] Already fetching intro for', componentDetails.name);
    return;
  }

  // ✅ GUARD: Skip if we just fetched this component (prevent rapid re-clicks)
  if (lastFetchedComponent === componentDetails.name) {
    console.log('⏭️ [handleComponentClick] Already fetched intro for', componentDetails.name);
    // Still update the current component but skip API call
    setCurrentComponent(componentDetails);
    return;
  }

  console.log('🖱️ [handleComponentClick] Clicked component:', componentDetails.name);
  
  // Set current component first
  setCurrentComponent(componentDetails);
  
  // Set flag and component name
  isFetchingComponentIntro = true;
  lastFetchedComponent = componentDetails.name;

  try {
    const payload = {
      title: componentDetails.name,
      overview: componentDetails.details,
      editableProps: componentDetails.editableFields.map((f) => ({
        key: f.key,
        label: f.label,
        description: f.description,
        type: f.type,
      })),
    };

    const { data } = await axios.post("/api/assistant/component-intro", payload, {
      headers: { "Content-Type": "application/json" },
    });

    setAssistantMessage(data.message);
  } catch (err) {
    console.error("Assistant fetch error:", err);
  } finally {
    // Clear flag after a delay to allow legitimate re-fetches
    setTimeout(() => {
      isFetchingComponentIntro = false;
      // Clear lastFetchedComponent after a longer delay
      setTimeout(() => {
        lastFetchedComponent = null;
      }, 1000);
    }, 100);
  }
};





export function useSyncLlmOutput<T extends object>(
  currentComponentName: string | undefined,
  targetComponentName: string,
  setComponentProps: React.Dispatch<React.SetStateAction<T>>,
  llmOutput: Partial<LlmTextOutput> | null,
  setLlmOutput: React.Dispatch<React.SetStateAction<Partial<LlmTextOutput> | null>>,
  editableFields: EditableField[]
) {
  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  // Use ref to track processed llmOutput to prevent infinite loops
  const processedOutputRef = useRef<string | null>(null);
  // Store editableFields in ref to avoid dependency issues
  const editableFieldsRef = useRef(editableFields);
  
  // Update ref when editableFields changes (but don't trigger effect)
  useEffect(() => {
    editableFieldsRef.current = editableFields;
  }, [editableFields]);
  
  useEffect(() => {
    if (!llmOutput || currentComponentName !== targetComponentName) return;

    // Create a hash of the llmOutput to track if we've already processed it
    const outputHash = JSON.stringify(llmOutput);
    if (processedOutputRef.current === outputHash) {
      return; // Already processed this output
    }

    // Get current component to capture "before" state (use getState to avoid dependency)
    // const currentPageData = useWebsiteStore.getState().currentPageData;
    // const currentComponent = currentPageData?.components?.find(
    //   (c: any) => c.type === targetComponentName
    // );
    // const beforeProps = currentComponent?.props || {};

    // Update local component props first
    setComponentProps((prev) => {
      const updatedProps: Partial<T> = { ...prev };

      editableFields.forEach((field) => {
        // Handle testimonial arrays
        if (field.type === "testimonialArray") {
          const arrayItems = (llmOutput.array || []).map((item) => ({
            ...item,
            type: "Testimonial",
          })) as BaseArrayItem[];
          updatedProps[field.key as keyof T] = arrayItems as unknown as T[keyof T];
          return;
        }

        // Handle standard arrays
        if (field.type === "standardArray") {
          const arrayItems = (llmOutput.array || []).map((item) => ({
            ...item,
            type: "StandardText",
          })) as BaseArrayItem[];
          updatedProps[field.key as keyof T] = arrayItems as unknown as T[keyof T];
          return;
        }

        // Handle normal fields (text, etc.)
        const value = llmOutput[field.key as keyof LlmTextOutput];
        if (value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "")) {
          updatedProps[field.key as keyof T] = value as unknown as T[keyof T];
        }
      });

      return { ...prev, ...updatedProps };
    });

    // Update store AFTER component props are set (use setTimeout to avoid infinite loop)
    setTimeout(() => {
      // Get fresh data from store
      const store = useWebsiteStore.getState();
      const currentPageSlug = store.currentPageSlug;
      const freshPageData = store.getPage(currentPageSlug);
      const freshComponent = freshPageData?.components?.find(
        (c: any) => c.type === targetComponentName
      );

      if (freshComponent?.id && Object.keys(llmOutput).length > 0) {
        // Build updated props from llmOutput
        const updatedProps: Record<string, any> = {};

        editableFields.forEach((field) => {
          if (field.type === "testimonialArray" || field.type === "standardArray") {
            const arrayItems = (llmOutput.array || []).map((item) => ({
              ...item,
              type: field.type === "testimonialArray" ? "Testimonial" : "StandardText",
            }));
            updatedProps[field.key] = arrayItems;
          } else {
            const value = llmOutput[field.key as keyof LlmTextOutput];
            if (value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "")) {
              updatedProps[field.key] = value;
            }
          }
        });

        if (Object.keys(updatedProps).length > 0) {
          store.updateComponentProps(currentPageSlug, freshComponent.id, updatedProps);
        }
      }

    }, 0);

    // Mark as processed BEFORE resetting llmOutput to prevent re-trigger
    processedOutputRef.current = outputHash;
    
    // Reset LLM output to prevent re-trigger
    setLlmOutput(null);
  }, [llmOutput, currentComponentName, targetComponentName, setComponentProps, setLlmOutput, editableFields, updateComponentProps]);
}





export function useSyncColorEdits<T extends Partial<BaseColorProps>>(
  currentComponentName: string | undefined,
  targetComponentName: string,
  setComponentProps: React.Dispatch<React.SetStateAction<T>>,
  colorEdits: Partial<BaseColorProps> | null,
  componentId?: string // Optional - will try to auto-detect if not provided
) {
  // Get updateComponentProps and current page data/slug from the store
  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);
  const getPage = useWebsiteStore((state) => state.getPage);
  const currentPageData = useMemo(() => getPage(currentPageSlug), [getPage, currentPageSlug]);
  
  const finalComponentId = useMemo(() => {
    if (componentId) return componentId; // Use provided ID
    
    // Try to find component ID from current page data when this component is selected
    if (currentPageData && currentComponentName === targetComponentName) {
      // Find component matching the target type
      const matchingComponent = currentPageData.components?.find(
        (comp: any) => comp.type === targetComponentName
      );
      return matchingComponent?.id;
    }
    return undefined;
  }, [componentId, currentPageData, currentComponentName, targetComponentName]);

  // First effect: Update local component props
  useEffect(() => {
    if (currentComponentName !== targetComponentName || !colorEdits) return;

    console.log(`🎨 [useSyncColorEdits] Syncing color edits for ${targetComponentName}:`, colorEdits);

    setComponentProps((prev: T) => {
      const updated: T = { ...prev, ...colorEdits };
    
      const initialBgLayout = prev.bgLayout;
      const incomingBgLayout = colorEdits.bgLayout;
      let finalBgLayout = initialBgLayout;
    
      if (incomingBgLayout) {
        // If type changes, drop fields that don't belong
        if (incomingBgLayout.type !== initialBgLayout?.type) {
          if (incomingBgLayout.type === "linear") {
            finalBgLayout = {
              type: "linear",
              direction: incomingBgLayout.direction || "to bottom",
              colorStops: incomingBgLayout.colorStops || [],
            };
          } else if (incomingBgLayout.type === "radial") {
            finalBgLayout = {
              type: "radial",
              radialSize: incomingBgLayout.radialSize || "125% 125%",
              radialPosition: incomingBgLayout.radialPosition || "50% 0%",
              radialBaseStop: incomingBgLayout.radialBaseStop || 50,
              colorStops: incomingBgLayout.colorStops || [],
            };
          } else {
            finalBgLayout = { type: "solid" };
          }
        } else {
          // same type → merge normally
          finalBgLayout = { ...initialBgLayout, ...incomingBgLayout };
        }
    
        updated.bgLayout = finalBgLayout;
      }
    
      return updated;
    });
    
  }, [currentComponentName, targetComponentName, colorEdits, setComponentProps]);

  // Second effect: Update store AFTER component props are updated (runs after render)
  useEffect(() => {
    if (currentComponentName !== targetComponentName || !colorEdits || !finalComponentId) return;

    // Get current component to capture "before" state
    const currentComponent = currentPageData?.components?.find((c: any) => c.id === finalComponentId);
    const beforeProps = currentComponent?.props || {};
    
    // Get current props to compare
    const currentProps = colorEdits;
    const propsToUpdate: Partial<BaseColorProps> = {};
    
    // Check what actually changed
    if (currentProps.textColor !== undefined) {
      propsToUpdate.textColor = currentProps.textColor;
    }
    if (currentProps.mainColor !== undefined) {
      propsToUpdate.mainColor = currentProps.mainColor;
    }
    if (currentProps.baseBgColor !== undefined) {
      propsToUpdate.baseBgColor = currentProps.baseBgColor;
    }
    if (currentProps.bgLayout !== undefined) {
      propsToUpdate.bgLayout = currentProps.bgLayout;
    }
    
    // Only update if there are actual changes
    if (Object.keys(propsToUpdate).length > 0) {
      // Track the edit BEFORE updating store
      const editHistory = useEditHistoryStore.getState();
      const changedProps: Record<string, { old: any; new: any }> = {};
      
      Object.keys(propsToUpdate).forEach((key) => {
        if (JSON.stringify(beforeProps[key]) !== JSON.stringify(propsToUpdate[key as keyof BaseColorProps])) {
          changedProps[key] = {
            old: beforeProps[key],
            new: propsToUpdate[key as keyof BaseColorProps],
          };
        }
      });
      
      // API route will create the edit history entry with full metadata
      // We just update the store here
      console.log(`💾 [useSyncColorEdits] Updating store for component ${finalComponentId}:`, propsToUpdate);
      updateComponentProps(currentPageSlug, finalComponentId, propsToUpdate);
      console.log(`✅ COLOR CHANGED AND JSON UPDATED SUCCESSFULLY for component ${finalComponentId}`);
    }
    
  }, [currentComponentName, targetComponentName, colorEdits, finalComponentId, updateComponentProps, currentPageData, currentPageSlug]);
}





export function extractTextProps<T extends Partial<BaseTextProps> & {
  textArray?: { title: string; description: string }[];
  testimonials?: { name: string; role: string; quote: string; alt?: string }[];
}>(
  componentProps: T
): Partial<BaseTextProps> & {
  textArray?: { title: string; description: string }[];
  testimonials?: { name: string; role: string; quote: string; alt?: string }[];
} {
  const result: Partial<BaseTextProps> & {
    textArray?: { title: string; description: string }[];
    testimonials?: { name: string; role: string; quote: string; alt?: string }[];
  } = {};

  if (componentProps.title !== undefined) result.title = componentProps.title;
  if (componentProps.description !== undefined) result.description = componentProps.description;
  if (componentProps.subTitle !== undefined) result.subTitle = componentProps.subTitle;
  if (componentProps.buttonText !== undefined) result.buttonText = componentProps.buttonText;

  if (componentProps.textArray !== undefined) result.textArray = componentProps.textArray;

  if (componentProps.testimonials !== undefined) {
    result.testimonials = componentProps.testimonials.map(t => ({
      name: t.name,
      role: t.role,
      quote: t.quote,
      alt: t.alt, // src excluded on purpose
    }));
  }

  return result;
}



export function useSyncTextToPage(
  componentId: string,
  componentType: string,
  textProps: Partial<BaseTextProps>,
  setCurrentPageData: React.Dispatch<React.SetStateAction<WebsitePage | null>>
) {
  useEffect(() => {
    setCurrentPageData(prev => {
      if (!prev) return null;

      const updatedTextSnapshots = prev.text.map(snapshot => 
        snapshot.componentId === componentId
          ? { ...snapshot, text: textProps }
          : snapshot
      );

      return {
        ...prev,
        text: updatedTextSnapshots
      };
    });
  }, [componentId, componentType, JSON.stringify(textProps), setCurrentPageData]);
}


// lib/hooks.ts
// lib/hooks.ts
// lib/hooks.ts


export function useSyncPageDataToComponent<T extends object>(
  componentId: string,
  componentType: string,
  setComponentProps: React.Dispatch<React.SetStateAction<T>>
) {
  // Subscribe directly to websiteData and currentPageSlug for proper reactivity
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);
  const getPage = useWebsiteStore((state) => state.getPage);

  const lastSyncedHashRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!websiteData) return;

    // Get current page data
    const currentPageData = getPage(currentPageSlug);
    if (!currentPageData) {
      console.warn(`⚠️ [useSyncPageDataToComponent] No page found for slug: ${currentPageSlug}`);
      return;
    }

    const componentInstance = currentPageData.components?.find((c: any) => c.id === componentId);
    if (!componentInstance || !componentInstance.props) {
      console.warn(`⚠️ [useSyncPageDataToComponent] Component ${componentId} not found in page ${currentPageSlug}`);
      return;
    }

    const propsHash = JSON.stringify(componentInstance.props);

    // Skip if unchanged
    if (propsHash === lastSyncedHashRef.current) {
      return;
    }

    // ✅ DEBOUNCE: Wait 50ms before syncing to avoid rapid-fire updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      console.log(`🔄 [useSyncPageDataToComponent] Syncing props for ${componentId} from store to component`);
      console.log(`🔄 [useSyncPageDataToComponent] Props:`, componentInstance.props);
      lastSyncedHashRef.current = propsHash;
      setComponentProps((prev) => ({ ...prev, ...structuredClone(componentInstance.props) }));
    }, 50);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [componentId, websiteData, currentPageSlug, getPage, setComponentProps]);
}

  
  
  
