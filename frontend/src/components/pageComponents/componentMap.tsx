import React from "react";
import { EditorialComponentProps } from "@/types/templateTypes";

/**
 * Component Map - Maps component types to their editorial components
 * 
 * This file should be updated by the parent project when components are injected.
 * The parent project will:
 * 1. Inject component files into components/designs/
 * 2. Update this file to import and register those components
 * 
 * For now, this is empty - components will be registered after injection.
 */
export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {};

/**
 * Creates a render function that maps component types to their editorial components
 * 
 * Handles missing components gracefully with a fallback UI.
 * Components must be registered in componentMap by the parent project.
 */
export function createRenderComponent() {
  return (component: any) => {
    // Hardcoded skip for removed components
    if (component.type === "samuraiCard") {
      console.warn(`Skipping removed component type: samuraiCard`);
      return null;
    }
    
    // Try to get from componentMap (populated by parent project)
    const Component = componentMap[component.type];
    if (Component) {
      return <Component id={component.id} />;
    }
    
    // Fallback: Show not found message
    // Parent project should inject components and update componentMap before rendering
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500 text-sm">
          Component <code className="bg-gray-100 px-2 py-1 rounded">{component.type}</code> not found
        </p>
        <p className="text-gray-400 text-xs mt-1">
          This component will be available after injection via GitHub API
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Parent project should inject components and update componentMap.tsx
        </p>
      </div>
    );
  };
}

export default componentMap;

