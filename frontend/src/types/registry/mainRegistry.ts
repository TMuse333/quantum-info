// Minimal registry types for template repo
// The full registry is not needed, just the type definitions

import { WebsiteComponent, EditorialComponentProps } from "../templateTypes";
import { EditableComponent } from "../componentTypes";

// Component Categories
export type ComponentCategory =
  | "hero"
  | "contentPiece"
  | "textComponent"
  | "testimonial"
  | "navbar"
  | "footer"
  | "carousel"
  | "miscellaneous";

// Component Type - this is a union of all possible component types
// For the template repo, we'll use a generic string type
export type ComponentType = string;

// Page Component Instance - represents a component instance on a page
export interface PageComponentInstance {
  id: string;
  type: ComponentType;
  props?: Record<string, unknown>;
  order: number;
  context?: string;
  sectionId?: string;
  componentCategory: ComponentCategory;
}

// Component Registry Entry - structure for registry entries
export interface ComponentRegistryEntry<T extends ComponentType = ComponentType> {
  type: T;
  component: WebsiteComponent<EditorialComponentProps, Record<string, unknown>>;
  componentCategory: ComponentCategory;
  title: string;
  description: string;
  editableProps: EditableComponent;
}

// Empty registry for template repo (components are passed via API)
export const COMPONENT_REGISTRY: Record<string, ComponentRegistryEntry> = {};

