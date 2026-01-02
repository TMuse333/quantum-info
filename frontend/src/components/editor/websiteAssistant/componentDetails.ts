/**
 * Component Details Map
 * 
 * Maps component types to their editable component details.
 * Parent project should update this when injecting components.
 * 
 * ⚠️ IMPORTANT: This file must be updated by the parent project when injecting components.
 * See PARENT_PROJECT_INJECTION_GUIDE.md for instructions.
 */

import type { EditableComponent } from '@/types/editorial';

// Import component details for editableFields
// Parent project should update these imports when injecting components
// Example:
// import { auroraImageHeroDetails } from "@/components/designs/herobanners/auroraImageHero";
// import { textAndListDetails } from "@/components/designs/textComponents/textAndList";
// ... etc for all injected components

/**
 * Map component types to their details
 * Parent project should populate this when injecting components
 * 
 * Example (after parent project injects components):
 * export const COMPONENT_DETAILS_MAP: Record<string, EditableComponent> = {
 *   auroraImageHero: auroraImageHeroDetails,
 *   textAndList: textAndListDetails,
 *   imageTextBox: imageTextBoxDetails,
 *   // ... etc for all injected components
 * };
 */
export const COMPONENT_DETAILS_MAP: Record<string, EditableComponent> = {};

/**
 * Convert a page component to an EditableComponent
 */
export function convertToEditableComponent(comp: any): EditableComponent {
  const categoryMap: Record<string, any> = {
    'hero': 'hero',
    'contentPiece': 'contentPiece',
    'textComponent': 'textComponent',
    'testimonial': 'testimonial',
    'navbar': 'navbar',
    'footer': 'footer',
    'carousel': 'carousel',
    'miscellaneous': 'miscellaneous',
  };

  const componentType = comp.type || comp.name;
  const componentDetails = COMPONENT_DETAILS_MAP[componentType];

  return {
    id: comp.id,
    name: componentDetails?.name || comp.name || comp.type || 'Component',
    details: componentDetails?.details || comp.details || `Component of type ${comp.type || 'unknown'}`,
    category: categoryMap[comp.componentCategory || comp.category || componentDetails?.category || 'contentPiece'] || 'contentPiece',
    editableFields: componentDetails?.editableFields || comp.editableFields || [],
    uniqueEdits: componentDetails?.uniqueEdits || comp.uniqueEdits,
  };
}

