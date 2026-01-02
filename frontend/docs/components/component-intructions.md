# Component Generation Guide for Claude

This guide provides instructions for generating components in the standard pattern used in this codebase. Follow these patterns exactly to ensure consistency and compatibility with the editorial system.

## Table of Contents

1. [Standard Component Structure](#standard-component-structure)
2. [Index.ts File](#indexts-file)
3. [Production Component](#production-component)
4. [Editorial Component](#editorial-component)
5. [Special Component Types](#special-component-types)
   - [Carousel Components](#carousel-components)
   - [Navbar Components](#navbar-components)
6. [Type Definitions](#type-definitions)
7. [Best Practices](#best-practices)

---

## Standard Component Structure

Every component must have three files in its directory:

```
componentName/
├── index.ts              # Registry, types, and exports
├── componentName.tsx     # Production component (required props)
└── componentNameEdit.tsx # Editorial component (with editor UI)
```

---

## Index.ts File

The `index.ts` file is the central registry for the component. It must include:

### 1. Imports

```typescript
import ComponentName from "./componentName";
import ComponentNameEdit from "./componentNameEdit";
import { 
  WebsiteComponent, 
  EditorialComponentProps, 
  BaseComponentProps, 
  EditableComponent, 
  ImageProp 
} from "@/types";
```

### 2. EditableComponent Definition

Define the component's editable metadata:

```typescript
export const componentNameDetails: EditableComponent = {
  name: "ComponentName", // Must match component name exactly
  details: "A clear description of what this component does and when to use it.",
  uniqueEdits: ["field1", "field2"], // Optional: fields that need special handling
  editableFields: [
    {
      key: "title",
      label: "Title",
      description: "Clear description of what this field controls",
      type: "text",
      wordLimit: 10, // Optional: for text fields
    },
    {
      key: "description",
      label: "Description",
      description: "Supporting text field",
      type: "text",
      wordLimit: 40,
    },
    {
      key: "textArray",
      label: "Text Array",
      description: "Array of items with title and description",
      type: "standardArray",
      arrayLength: { min: 3, max: 8 }, // Optional constraints
    },
    {
      key: "testimonialArray",
      label: "Testimonials",
      description: "Array of testimonials",
      type: "testimonialArray",
      arrayLength: { min: 2, max: 6 },
    },
    {
      key: "mainImage",
      label: "Main Image",
      description: "Primary image for the component",
      type: "image",
    },
    {
      key: "textColor",
      label: "Text Color",
      description: "Main body text color; should contrast with baseBgColor",
      type: "color",
    },
    {
      key: "baseBgColor",
      label: "Background Color",
      description: "Base background color on the screen",
      type: "color",
    },
    {
      key: "mainColor",
      label: "Accent Color",
      description: "Foreground color for highlights, gradients, buttons, borders, and accents",
      type: "color",
    },
    {
      key: "bgLayout",
      label: "Background Layout",
      description: "The layout for the background colors (radial, linear, or solid)",
      type: "gradient",
    },
  ],
  category: "textComponent", // Options: "textComponent", "hero", "carousel", "navbar", "contentPiece", etc.
};
```

### 3. Default Props

Define default values for all props:

```typescript
export const defaultComponentNameProps = {
  title: "Default Title",
  description: "Default description text",
  subTitle: "Default Subtitle",
  buttonText: "Click Here",
  textArray: [
    {
      title: "First Item",
      description: "Description of first item",
    },
    {
      title: "Second Item",
      description: "Description of second item",
    },
  ],
  images: {
    main: {
      src: "/placeholder.webp",
      alt: "placeholder",
    } as ImageProp,
  },
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial" as const,
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  },
  array: [], // Always include empty array for array fields
  items: [], // For carousel/navbar items
};
```

### 4. Props Interface

**IMPORTANT:** For production components, props should be **required** (not partial), since they will always be passed in:

```typescript
export interface ComponentNameProps extends BaseComponentProps {
  title: string; // Required, not optional
  description: string;
  subTitle?: string; // Only optional if truly optional
  textArray: Array<{ title: string; description: string }>;
  images: {
    main: ImageProp;
  };
  // Color props are typically required
  textColor: string;
  baseBgColor: string;
  mainColor: string;
  bgLayout: GradientConfig;
}
```

**Note:** The interface in `index.ts` can still extend `Partial<BaseComponentProps>` for the registry, but the production component should expect required props.

### 5. Component Registry Entry

```typescript
export const componentNameComponent: WebsiteComponent<
  EditorialComponentProps, 
  ComponentNameProps // Use full props, not Partial
> = {
  editorial: ComponentNameEdit,
  production: ComponentName,
  editableProps: componentNameDetails,
};
```

### 6. Exports

```typescript
export { ComponentName, ComponentNameEdit };
```

---

## Production Component

The production component is the final, rendered version used in the live website.

### Key Requirements:

1. **Props are REQUIRED** - No optional chaining or safe checks needed
2. **Use defaultProps for merging** - Merge with defaults, but assume props exist
3. **"use client" directive** - Always include at the top
4. **Color utilities** - Use `deriveColorPalette` and `useAnimatedGradient`

### Template:

```typescript
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ComponentNameProps, defaultComponentNameProps } from ".";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";

const ComponentName: React.FC<ComponentNameProps> = (props) => {
  // Merge with defaults (props are required, but defaults provide fallbacks)
  const {
    title,
    description,
    subTitle,
    textArray = [],
    images,
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = { ...defaultComponentNameProps, ...props };

  // Derive color palette
  const colors = deriveColorPalette({
    textColor: textColor ?? defaultComponentNameProps.textColor,
    baseBgColor: baseBgColor ?? defaultComponentNameProps.baseBgColor,
    mainColor: mainColor ?? defaultComponentNameProps.mainColor,
    bgLayout: bgLayout ?? defaultComponentNameProps.bgLayout,
  });

  // Get animated gradient background
  const background = useAnimatedGradient(
    bgLayout ?? defaultComponentNameProps.bgLayout,
    colors
  );

  // Access images directly (they are required)
  const mainImage = images.main;

  return (
    <motion.section
      style={{ background, color: colors.textColor }}
      className="w-full py-20 px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Component content */}
        <h1>{title}</h1>
        <p>{description}</p>
        
        {/* Use Image component for images */}
        <Image
          src={mainImage.src}
          alt={mainImage.alt}
          width={600}
          height={400}
          className="rounded-lg"
        />
      </div>
    </motion.section>
  );
};

export default ComponentName;
```

### Important Notes for Production Components:

- **No optional chaining on required props** - If a prop is required in the interface, use it directly
- **No "if exists" checks** - Props are guaranteed to exist
- **Use defaults only for merging** - The `??` operator is only for color fallbacks, not for required content
- **Always use motion.section** - Wrap in framer-motion for animations
- **Use Image from next/image** - Never use `<img>` tags

---

## Editorial Component

The editorial component includes the editor UI and hooks for syncing with the store.

### Key Requirements:

1. **Uses EditorialComponentProps** - Receives `{ id }` prop
2. **State management** - Uses `componentProps` state
3. **Sync hooks** - Uses `useSyncLlmOutput`, `useSyncColorEdits`, `useSyncPageDataToComponent`
4. **Editor UI** - Includes `EditableTextField`, `ImageField`, color editors
5. **Component click handler** - Uses `handleComponentClick`

### Template:

```typescript
"use client";

import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { EditorialComponentProps, GradientConfig } from "@/types";
import { defaultComponentNameProps, ComponentNameProps } from ".";
import { useComponentEditor } from "@/context/context";
import {
  handleComponentClick,
  useSyncLlmOutput,
  useSyncColorEdits,
  useSyncPageDataToComponent,
} from "../../../../lib/hooks/hooks";
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { componentNameDetails } from ".";
import useWebsiteStore from "@/stores/websiteStore";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import ImageField from "@/components/editor/imageField/imageField";

const ComponentNameEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<Partial<ComponentNameProps>>({});

  const {
    setCurrentComponent,
    currentComponent,
    setAssistantMessage,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    currentColorEdits,
    setCurrentColorEdits,
  } = useComponentEditor();

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);

  // Merge with defaults
  const {
    title,
    description,
    subTitle,
    textArray = [],
    images,
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = { ...defaultComponentNameProps, ...componentProps };

  // Color utilities
  const colors = deriveColorPalette(
    {
      textColor: textColor ?? "#000000",
      baseBgColor: baseBgColor ?? "#f0f9ff",
      mainColor: mainColor ?? "#3B82F6",
      bgLayout: bgLayout ?? { type: "radial" },
    },
    (bgLayout ?? { type: "radial" }).type
  );
  const background = useAnimatedGradient(colors.bgLayout as GradientConfig, colors);

  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.5 });

  // Sync hooks - CRITICAL: Must include all three
  useSyncLlmOutput(
    currentComponent?.name,
    "ComponentName", // Must match componentNameDetails.name exactly
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    componentNameDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "ComponentName",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(id, "ComponentName", setComponentProps);

  // Click handler
  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: componentNameDetails,
      setCurrentComponent,
      setAssistantMessage,
    });
    setCurrentColorEdits({
      textColor: colors.textColor ?? "#000000",
      baseBgColor: colors.baseBgColor ?? "#f0f9ff",
      mainColor: colors.mainColor ?? "#3B82F6",
      bgLayout: bgLayout ?? { type: "radial" },
    });
  };

  // Update prop function
  const updateProp = <K extends keyof ComponentNameProps>(
    key: K,
    value: ComponentNameProps[K]
  ) => {
    const updated = { ...componentProps, [key]: value };
    setComponentProps(updated);
    updateComponentProps(id, updated);
  };

  return (
    <motion.section
      ref={sectionRef}
      onClick={onClick}
      style={{ background, color: colors.textColor }}
      className="w-full py-20 px-6 cursor-pointer relative"
    >
      {/* Editor UI - Show when this component is selected */}
      {currentComponent?.id === id && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10 max-w-md">
          <h3 className="font-bold mb-2">Edit ComponentName</h3>
          
          <EditableTextField
            label="Title"
            value={title}
            onChange={(val) => updateProp("title", val)}
            fieldKey="title"
            componentName="ComponentName"
            id={id}
          />
          
          <EditableTextField
            label="Description"
            value={description}
            onChange={(val) => updateProp("description", val)}
            fieldKey="description"
            componentName="ComponentName"
            id={id}
          />
          
          <ImageField
            label="Main Image"
            image={images?.main}
            onChange={(img) =>
              updateProp("images", {
                ...images,
                main: img,
              })
            }
            fieldKey="mainImage"
            componentName="ComponentName"
            id={id}
          />
        </div>
      )}

      {/* Render the actual component content */}
      <div className="max-w-6xl mx-auto">
        <h1>{title}</h1>
        <p>{description}</p>
        {/* Render component content same as production */}
      </div>
    </motion.section>
  );
};

export default ComponentNameEdit;
```

### Important Notes for Editorial Components:

- **Always include all three sync hooks** - `useSyncLlmOutput`, `useSyncColorEdits`, `useSyncPageDataToComponent`
- **Component name must match exactly** - The string in sync hooks must match `componentNameDetails.name`
- **Use `Partial<ComponentNameProps>` for state** - State is partial until synced
- **Include onClick handler** - Must call `handleComponentClick` and `setCurrentColorEdits`
- **Show editor UI conditionally** - Only show when `currentComponent?.id === id`
- **Use EditableTextField for text** - Never use regular inputs
- **Use ImageField for images** - Never use regular file inputs

---

## Special Component Types

### Carousel Components

Carousels have special handling for the `items` field.

#### In index.ts:

```typescript
import { CarouselItem } from "@/types";

export const carouselComponentDetails: EditableComponent = {
  name: "CarouselComponent",
  details: "A carousel with images and descriptions",
  editableFields: [
    // ... other fields ...
    {
      key: "items",
      label: "Carousel Items",
      description: "Array of images and descriptions",
      type: "carousel", // Special type for carousels
    },
  ],
  category: "carousel",
};

export interface CarouselComponentProps extends BaseComponentProps {
  items: CarouselItem[]; // Required array of CarouselItem
}

export const defaultCarouselComponentProps = {
  // ... other defaults ...
  items: [
    {
      image: { src: "/placeholder.webp", alt: "Slide 1" },
      description: "First slide description",
    },
    {
      image: { src: "/placeholder.webp", alt: "Slide 2" },
      description: "Second slide description",
    },
  ] as CarouselItem[],
};
```

#### CarouselItem Type:

```typescript
export interface CarouselItem {
  image: ImageProp;
  description?: string;
  title?: string;
}
```

#### In Production Component:

```typescript
const CarouselComponent: React.FC<CarouselComponentProps> = (props) => {
  const { items, ...rest } = { ...defaultCarouselComponentProps, ...props };
  
  // Items are required, no safe checks needed
  const [currentIndex, setCurrentIndex] = useState(0);
  
  return (
    <div>
      {items.map((item, index) => (
        <div key={index}>
          <Image src={item.image.src} alt={item.image.alt} />
          {item.description && <p>{item.description}</p>}
        </div>
      ))}
    </div>
  );
};
```

#### In Editorial Component:

Carousel items are edited through the `CarouselEditorPanel` (automatically shown for carousel components). No special handling needed in the editorial component itself.

---

### Navbar Components

Navbars have special handling for the `items` field and use `uniqueEdits`.

#### In index.ts:

```typescript
import { NavItem, NavItemType, NavbarProps } from "@/types";

export const navbarComponentDetails: EditableComponent = {
  name: "Navbar1",
  details: "Navigation bar with links, scroll anchors, and submenu support",
  uniqueEdits: ["items"], // Mark items as needing special handling
  editableFields: [
    // ... other fields ...
    {
      key: "items",
      label: "Navigation Items",
      description: "Configure navigation links, scrolls, and submenus",
      type: "navbar", // Special type for navbars
      allowedItemTypes: ["link", "scroll", "external", "submenu"],
      maxDepth: 2, // Optional: max nesting depth
    },
    // ... color fields ...
  ],
  category: "navbar",
};

export interface NavbarComponentProps extends BaseColorProps {
  tabs: NavItem[]; // Required array (often named "tabs" instead of "items")
  logoSrc?: string;
  logoAlt?: string;
  logoText?: string;
  sticky?: boolean;
  alignment?: "left" | "center" | "right";
  ctaDestination?: string;
  buttonText?: string;
}
```

#### NavItem Type:

```typescript
export interface NavItem {
  type: NavItemType; // "link" | "scroll" | "external" | "submenu"
  label: string;
  href?: string; // for link/external
  scrollTo?: string; // for scroll (component id)
  target?: "_blank"; // for external
  children?: NavItem[]; // for submenu
}
```

#### In Production Component:

```typescript
const Navbar1: React.FC<Navbar1Props> = (props) => {
  const { tabs, logoSrc, logoText, ...rest } = props;
  
  // Tabs are required, no safe checks needed
  return (
    <nav>
      {logoText && <div>{logoText}</div>}
      {tabs.map((tab, index) => (
        <a key={index} href={tab.href || `#${tab.scrollTo}`}>
          {tab.label}
        </a>
      ))}
    </nav>
  );
};
```

#### In Editorial Component:

Navbar items are edited through the `NavbarEditorPanel` (automatically shown for navbar components). The editorial component should still render the navbar for preview.

---

## Type Definitions

### Standard Field Types:

- `"text"` - Single text field
- `"color"` - Color picker
- `"gradient"` - Gradient configuration
- `"image"` - Image upload/selection
- `"standardArray"` - Array of `{ title: string, description: string }`
- `"testimonialArray"` - Array of testimonials with `{ name, role, quote, src?, alt? }`
- `"carousel"` - Array of `CarouselItem`
- `"navbar"` - Array of `NavItem`

### Base Types to Import:

```typescript
import {
  WebsiteComponent,
  EditorialComponentProps,
  BaseComponentProps,
  BaseColorProps,
  EditableComponent,
  ImageProp,
  GradientConfig,
  CarouselItem,
  NavItem,
  NavItemType,
} from "@/types";
```

---

## Best Practices

### 1. Naming Conventions

- **Component name**: PascalCase (e.g., `TextAndList`, `CarouselHero`)
- **File names**: camelCase matching component (e.g., `textAndList.tsx`)
- **Props interface**: `ComponentNameProps`
- **Default props**: `defaultComponentNameProps`
- **Details object**: `componentNameDetails`
- **Registry entry**: `componentNameComponent`

### 2. Required vs Optional Props

- **Production components**: Props should be required (not `Partial<>`)
- **Editorial components**: State uses `Partial<ComponentNameProps>`
- **Index.ts interface**: Can use `Partial<BaseComponentProps>` for registry compatibility

### 3. Color Handling

- Always include `textColor`, `baseBgColor`, `mainColor`, and `bgLayout` in editableFields
- Use `deriveColorPalette` for color calculations
- Use `useAnimatedGradient` for background gradients
- Set current colors in `onClick` handler

### 4. Image Handling

- Use `ImageProp` type for images
- Always include `src` and `alt` properties
- Use Next.js `Image` component, never `<img>` tags
- Use `ImageField` in editorial components

### 5. Array Fields

- Use `standardArray` for simple title/description lists
- Use `testimonialArray` for testimonials
- Use `carousel` type for carousel items
- Use `navbar` type for navigation items
- Always provide empty array defaults: `[]`

### 6. Sync Hooks Order

Always include sync hooks in this order:

```typescript
useSyncLlmOutput(...);
useSyncColorEdits(...);
useSyncPageDataToComponent(...);
```

### 7. Component Click Handler

Always include in editorial component:

```typescript
const onClick = () => {
  handleComponentClick({
    currentComponent: currentComponent!,
    componentDetails: componentNameDetails,
    setCurrentComponent,
    setAssistantMessage,
  });
  setCurrentColorEdits({
    textColor: colors.textColor ?? "#000000",
    baseBgColor: colors.baseBgColor ?? "#f0f9ff",
    mainColor: colors.mainColor ?? "#3B82F6",
    bgLayout: bgLayout ?? { type: "radial" },
  });
};
```

### 8. Category Values

Use appropriate category:
- `"textComponent"` - Text-based components
- `"hero"` - Hero banners
- `"carousel"` - Carousel components
- `"navbar"` - Navigation bars
- `"contentPiece"` - Content sections
- `"footer"` - Footer components

### 9. File Structure

```
src/components/designs/
├── categoryName/
│   └── componentName/
│       ├── index.ts
│       ├── componentName.tsx
│       └── componentNameEdit.tsx
```

### 4. Register in Component Map (REQUIRED)

**CRITICAL:** After creating a new component, you MUST update \`src/components/pageComponents/componentMap.tsx\`. Without this, the component will not render and will show "Unknown component type" error.

**Location:** \`src/components/pageComponents/componentMap.tsx\`

**What to add:**

1. **Import statement** at the top with other imports:
\`\`\`typescript
import { ComponentNameEdit } from "@/components/designs/[category]/[componentName]";
\`\`\`

2. **Entry in componentMap object**:
\`\`\`typescript
export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {
  // ... existing entries ...
  componentName: ComponentNameEdit, // Add this entry
};
\`\`\`

**Important:**
- The key in the map (e.g., \`componentName\`) must match the \`type\` field used in \`websiteData.json\`
- Use camelCase for the map key (e.g., \`myNewComponent\`)
- Place the import in the appropriate section (Hero Banners, Content Pieces, etc.)
- Place the map entry in the corresponding section of the componentMap object
- **This step is REQUIRED - the component will not render without it**

### 10. Export from Category Index

After creating component, export from category index:

```typescript
// src/components/designs/categoryName/index.ts
export * from './componentName';
```

---

## Checklist

Before considering a component complete, verify:

- [ ] All three files exist (index.ts, componentName.tsx, componentNameEdit.tsx)
- [ ] Production component has required props (not Partial)
- [ ] Production component has no optional chaining on required props
- [ ] Editorial component includes all three sync hooks
- [ ] Component name matches exactly in all places
- [ ] Default props include all required fields
- [ ] Color fields are included in editableFields
- [ ] onClick handler sets currentColorEdits
- [ ] Component is exported from category index
- [ ] **Component is added to componentMap.tsx** (REQUIRED - component won't render without this)
- [ ] Import added to componentMap.tsx
- [ ] Map entry added to componentMap object
- [ ] Map key matches the type used in websiteData.json
- [ ] Types are properly imported
- [ ] "use client" directive is present
- [ ] Framer Motion is used for animations
- [ ] Next.js Image component is used (not <img>)

---

## Example: Complete Component

See `frontend/src/components/designs/textComponents/textAndList/` for a complete reference implementation.

---

## Questions?

If you encounter issues or need clarification, you can see examples in the designs folder.

