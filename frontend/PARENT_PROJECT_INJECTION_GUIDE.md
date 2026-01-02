# Parent Project Injection Guide

**Purpose:** Complete guide for parent project to inject components and website data into user's development branch.

**Target Branch:** `development` (template branch)

---

## Overview

When onboarding a new user, the parent project needs to:

1. ✅ Create user repo from `development` branch template
2. ✅ Inject component files into `components/designs/`
3. ✅ Update `componentMap.tsx` to register components
4. ✅ Update `componentDetails.ts` to register component details
5. ✅ Inject `websiteData.json` with user's website data

---

## Step 1: Create User Repository

```typescript
// Parent project code
const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Create repo from template
const { data: repo } = await octokit.repos.createUsingTemplate({
  template_owner: 'TMuse333',
  template_repo: 'next-js-template',
  owner: 'your-org',
  name: `${userId}-website`,
  description: `Website for user ${userId}`,
});

// Clone development branch (not main)
await octokit.repos.createOrUpdateFileContents({
  owner: 'your-org',
  repo: `${userId}-website`,
  path: '.gitignore',
  message: 'Initial commit from template',
  content: Buffer.from('.env\nnode_modules\n').toString('base64'),
  branch: 'development',
});
```

---

## Step 2: Inject Component Files

### Component File Structure

Each component needs **3 files** in this structure:

```
components/designs/
├── herobanners/
│   └── auroraImageHero/
│       ├── auroraImageHeroEdit.tsx      # Editor component
│       ├── auroraImageHero.prod.tsx     # Production component
│       └── index.ts                      # Exports
├── contentPieces/
│   └── experienceCard/
│       ├── experienceCardEdit.tsx
│       ├── experienceCard.prod.tsx
│       └── index.ts
└── ...
```

### Required Component Files

For each component type in `websiteData.json`, inject:

1. **Edit Component** (`*Edit.tsx`): Used in the editor
2. **Production Component** (`*.prod.tsx`): Used in production builds
3. **Index File** (`index.ts`): Exports the component

### Injection Example

```typescript
// Parent project code
const componentsToInject = [
  {
    type: 'auroraImageHero',
    category: 'herobanners',
    files: {
      edit: auroraImageHeroEditContent,      // Component file content
      prod: auroraImageHeroProdContent,      // Component file content
      index: auroraImageHeroIndexContent,    // Index file content
    }
  },
  {
    type: 'textAndList',
    category: 'textComponents',
    files: {
      edit: textAndListEditContent,
      prod: textAndListProdContent,
      index: textAndListIndexContent,
    }
  },
  // ... etc for all components in websiteData.json
];

// Inject each component
for (const component of componentsToInject) {
  const basePath = `frontend/src/components/designs/${component.category}/${component.type}`;
  
  // Inject edit component
  await octokit.repos.createOrUpdateFileContents({
    owner: 'your-org',
    repo: `${userId}-website`,
    path: `${basePath}/${component.type}Edit.tsx`,
    message: `Add ${component.type} edit component`,
    content: Buffer.from(component.files.edit).toString('base64'),
    branch: 'development',
  });
  
  // Inject production component
  await octokit.repos.createOrUpdateFileContents({
    owner: 'your-org',
    repo: `${userId}-website`,
    path: `${basePath}/${component.type}.prod.tsx`,
    message: `Add ${component.type} production component`,
    content: Buffer.from(component.files.prod).toString('base64'),
    branch: 'development',
  });
  
  // Inject index file
  await octokit.repos.createOrUpdateFileContents({
    owner: 'your-org',
    repo: `${userId}-website`,
    path: `${basePath}/index.ts`,
    message: `Add ${component.type} index`,
    content: Buffer.from(component.files.index).toString('base64'),
    branch: 'development',
  });
}
```

### Component File Requirements

#### Edit Component (`*Edit.tsx`)
- Must accept `id: string` prop
- Must use `useWebsiteStore` to get component data
- Must export as default or named export

```typescript
// Example: auroraImageHeroEdit.tsx
"use client";
import React from 'react';
import useWebsiteStore from '@/stores/websiteStore';
import { EditorialComponentProps } from '@/types/templateTypes';

export default function AuroraImageHeroEdit({ id }: EditorialComponentProps) {
  const { websiteData, currentPageSlug } = useWebsiteStore();
  // ... component logic
}
```

#### Production Component (`*.prod.tsx`)
- Must accept props matching component structure in `websiteData.json`
- Should be optimized for production (no editor UI)

```typescript
// Example: auroraImageHero.prod.tsx
import React from 'react';

interface AuroraImageHeroProps {
  title: string;
  description: string;
  // ... other props from websiteData.json
}

export default function AuroraImageHero(props: AuroraImageHeroProps) {
  // ... production component logic
}
```

#### Index File (`index.ts`)
- Must export both edit and prod components
- Must export component details (for websiteAssistant)

```typescript
// Example: index.ts
export { default as AuroraImageHeroEdit } from './auroraImageHeroEdit';
export { default as AuroraImageHero } from './auroraImageHero.prod';
export { auroraImageHeroDetails } from './auroraImageHeroDetails'; // See componentDetails section
```

---

## Step 3: Update componentMap.tsx

After injecting components, update `componentMap.tsx` to register them.

### File Location
`frontend/src/components/pageComponents/componentMap.tsx`

### Current State (Template)
```typescript
export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {};
```

### Required Update

```typescript
import React from "react";
import { EditorialComponentProps } from "@/types/templateTypes";

// Import injected components
import AuroraImageHeroEdit from "@/components/designs/herobanners/auroraImageHero/auroraImageHeroEdit";
import { TextAndListEdit } from "@/components/designs/textComponents/textAndList";
import { ImageTextBoxEdit } from "@/components/designs/contentPieces/imageTextBox";
// ... import all injected components

export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {
  auroraImageHero: AuroraImageHeroEdit,
  textAndList: TextAndListEdit,
  imageTextBox: ImageTextBoxEdit,
  // ... register all injected components
  // ⚠️ IMPORTANT: The key must match the `type` field in websiteData.json
};

export function createRenderComponent() {
  return (component: any) => {
    if (component.type === "samuraiCard") {
      console.warn(`Skipping removed component type: samuraiCard`);
      return null;
    }
    
    const Component = componentMap[component.type];
    if (Component) {
      return <Component id={component.id} />;
    }
    
    // Fallback for missing components
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500 text-sm">
          Component <code className="bg-gray-100 px-2 py-1 rounded">{component.type}</code> not found
        </p>
      </div>
    );
  };
}

export default componentMap;
```

### Injection Code

```typescript
// Parent project code
const componentMapContent = `
import React from "react";
import { EditorialComponentProps } from "@/types/templateTypes";

// Import injected components
${injectedComponents.map(comp => 
  `import ${comp.importName} from "@/components/designs/${comp.category}/${comp.type}/${comp.importPath}";`
).join('\n')}

export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {
${injectedComponents.map(comp => 
  `  ${comp.type}: ${comp.importName},`
).join('\n')}
};

export function createRenderComponent() {
  return (component: any) => {
    if (component.type === "samuraiCard") {
      console.warn(\`Skipping removed component type: samuraiCard\`);
      return null;
    }
    
    const Component = componentMap[component.type];
    if (Component) {
      return <Component id={component.id} />;
    }
    
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500 text-sm">
          Component <code className="bg-gray-100 px-2 py-1 rounded">{component.type}</code> not found
        </p>
      </div>
    );
  };
}

export default componentMap;
`;

await octokit.repos.createOrUpdateFileContents({
  owner: 'your-org',
  repo: `${userId}-website`,
  path: 'frontend/src/components/pageComponents/componentMap.tsx',
  message: 'Register injected components in componentMap',
  content: Buffer.from(componentMapContent).toString('base64'),
  branch: 'development',
});
```

---

## Step 4: Update componentDetails.ts

Update `componentDetails.ts` to register component details for the website assistant.

### File Location
`frontend/src/components/editor/websiteAssistant/componentDetails.ts`

### Current State (Template)
```typescript
export const COMPONENT_DETAILS_MAP: Record<string, EditableComponent> = {};
```

### Required Update

```typescript
import type { EditableComponent } from '@/types/editorial';

// Import component details
import { auroraImageHeroDetails } from "@/components/designs/herobanners/auroraImageHero";
import { textAndListDetails } from "@/components/designs/textComponents/textAndList";
// ... import all component details

export const COMPONENT_DETAILS_MAP: Record<string, EditableComponent> = {
  auroraImageHero: auroraImageHeroDetails,
  textAndList: textAndListDetails,
  // ... register all component details
  // ⚠️ IMPORTANT: Keys must match component types in websiteData.json
};

export function convertToEditableComponent(comp: any): EditableComponent {
  // ... implementation (already exists in template)
}
```

### Component Details Structure

Each component needs a `details` export. This should be in the component's `index.ts`:

```typescript
// Example: components/designs/herobanners/auroraImageHero/index.ts
export { default as AuroraImageHeroEdit } from './auroraImageHeroEdit';
export { default as AuroraImageHero } from './auroraImageHero.prod';

// Component details for website assistant
export const auroraImageHeroDetails: EditableComponent = {
  name: 'Aurora Image Hero',
  details: 'A hero banner with image and gradient overlay',
  category: 'hero',
  editableFields: [
    { name: 'title', type: 'text', label: 'Title' },
    { name: 'description', type: 'text', label: 'Description' },
    { name: 'mainColor', type: 'color', label: 'Main Color' },
    { name: 'textColor', type: 'color', label: 'Text Color' },
    // ... etc
  ],
  uniqueEdits: {
    // Component-specific edit configurations
  },
};
```

### Injection Code

```typescript
// Parent project code
const componentDetailsContent = `
import type { EditableComponent } from '@/types/editorial';

// Import component details
${injectedComponents.map(comp => 
  `import { ${comp.detailsExportName} } from "@/components/designs/${comp.category}/${comp.type}";`
).join('\n')}

export const COMPONENT_DETAILS_MAP: Record<string, EditableComponent> = {
${injectedComponents.map(comp => 
  `  ${comp.type}: ${comp.detailsExportName},`
).join('\n')}
};

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
    details: componentDetails?.details || comp.details || \`Component of type \${comp.type || 'unknown'}\`,
    category: categoryMap[comp.componentCategory || comp.category || componentDetails?.category || 'contentPiece'] || 'contentPiece',
    editableFields: componentDetails?.editableFields || comp.editableFields || [],
    uniqueEdits: componentDetails?.uniqueEdits || comp.uniqueEdits,
  };
}
`;

await octokit.repos.createOrUpdateFileContents({
  owner: 'your-org',
  repo: `${userId}-website`,
  path: 'frontend/src/components/editor/websiteAssistant/componentDetails.ts',
  message: 'Register component details for website assistant',
  content: Buffer.from(componentDetailsContent).toString('base64'),
  branch: 'development',
});
```

---

## Step 5: Inject websiteData.json

Inject the user's website data into `websiteData.json`.

### File Location
`frontend/src/data/websiteData.json`

### Current State (Template)
```json
{
  "templateName": "blank",
  "websiteName": "My Website",
  "status": "draft",
  "currentVersionNumber": 0,
  "colorTheme": {
    "primary": "#3B82F6",
    "text": "#FFFFFF",
    "background": "#000000",
    "bgLayout": { "type": "solid" }
  },
  "seoMetadata": {},
  "pages": {
    "index": {
      "id": "index",
      "name": "Home",
      "path": "/",
      "components": []
    }
  },
  "deployment": { /* ... */ },
  "formData": {},
  "ownerId": "",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Required Structure

```json
{
  "templateName": "Default Template",
  "websiteName": "User's Website Name",
  "status": "in-progress",
  "currentVersionNumber": 1,
  "colorTheme": {
    "primary": "#006d8f",
    "text": "#ffffff",
    "background": "#000000",
    "bgLayout": {
      "type": "radial",
      "radialSize": "125% 125%",
      "radialPosition": "50% 0%",
      "radialBaseStop": 50
    },
    "updatedAt": "2025-12-27T00:00:00.000Z",
    "source": "manual"
  },
  "seoMetadata": {
    "title": "User's Website",
    "description": "Website description"
  },
  "pages": {
    "index": {
      "id": "index",
      "name": "Home",
      "path": "/",
      "components": [
        {
          "id": "hero-1",
          "type": "auroraImageHero",  // ⚠️ Must match componentMap key
          "order": 0,
          "props": {
            "title": "Welcome",
            "description": "Welcome to my website",
            "mainColor": "#006d8f",
            "textColor": "#ffffff",
            "baseBgColor": "#000000",
            "bgLayout": { "type": "radial" },
            "images": {
              "main": {
                "src": "https://example.com/image.jpg",
                "alt": "Hero Image"
              }
            },
            "subTitle": "Subtitle",
            "buttonText": "Get Started"
          }
        },
        {
          "id": "text-1",
          "type": "textAndList",  // ⚠️ Must match componentMap key
          "order": 1,
          "props": {
            "title": "Features",
            "description": "Our features",
            "textArray": [
              { "title": "Feature 1", "description": "Description 1" }
            ],
            // ... other props
          }
        }
      ]
    }
  },
  "deployment": {
    "githubOwner": "your-org",
    "githubRepo": "user123-website",
    "vercelProjectId": "",
    "vercelProductionUrl": "",
    "lastDeploymentStatus": "pending",
    "customDomain": null,
    "totalDeployments": 0,
    "successfulDeployments": 0,
    "failedDeployments": 0,
    "lastDeploymentId": null,
    "lastCommitSha": null,
    "lastBuildTime": null
  },
  "formData": {},
  "ownerId": "user123",
  "createdAt": "2025-12-27T00:00:00.000Z",
  "updatedAt": "2025-12-27T00:00:00.000Z"
}
```

### Key Requirements

1. **Component Types Must Match**: `component.type` in `websiteData.json` must match keys in `componentMap.tsx`
2. **Component IDs Must Be Unique**: Each component needs a unique `id`
3. **Order Field**: Components should have an `order` field for rendering order
4. **Props Structure**: Component `props` must match what the production component expects

### Injection Code

```typescript
// Parent project code
const websiteData = {
  templateName: "Default Template",
  websiteName: userWebsiteName,
  status: "in-progress",
  currentVersionNumber: 1,
  colorTheme: userColorTheme,
  seoMetadata: userSeoMetadata,
  pages: {
    index: {
      id: "index",
      name: "Home",
      path: "/",
      components: userComponents, // Array of component objects
    }
  },
  deployment: {
    githubOwner: "your-org",
    githubRepo: `${userId}-website`,
    // ... other deployment fields
  },
  formData: {},
  ownerId: userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await octokit.repos.createOrUpdateFileContents({
  owner: 'your-org',
  repo: `${userId}-website`,
  path: 'frontend/src/data/websiteData.json',
  message: 'Initialize website data',
  content: Buffer.from(JSON.stringify(websiteData, null, 2)).toString('base64'),
  branch: 'development',
});
```

---

## Complete Injection Workflow

### Recommended Order

1. **Create user repo** from development branch template
2. **Inject component files** (all 3 files per component)
3. **Update componentMap.tsx** (register components)
4. **Update componentDetails.ts** (register component details)
5. **Inject websiteData.json** (user's website data)

### Validation Checklist

After injection, verify:

- [ ] All component files exist in `components/designs/`
- [ ] `componentMap.tsx` has imports and registrations for all components
- [ ] `componentDetails.ts` has imports and registrations for all components
- [ ] `websiteData.json` has valid structure
- [ ] All `component.type` in `websiteData.json` match `componentMap.tsx` keys
- [ ] All component IDs are unique
- [ ] Component props match production component expectations

### Testing

After injection, the user should be able to:

1. ✅ View their website in the editor
2. ✅ See all components rendered correctly
3. ✅ Edit components using the website assistant
4. ✅ Save changes to GitHub
5. ✅ Deploy to production

---

## Common Issues & Solutions

### Issue: Component not rendering
**Solution:** Check that `component.type` in `websiteData.json` matches the key in `componentMap.tsx`

### Issue: Website assistant can't find component
**Solution:** Check that component details are registered in `componentDetails.ts`

### Issue: TypeScript errors after injection
**Solution:** Ensure all imports in `componentMap.tsx` and `componentDetails.ts` are correct

### Issue: Component props not updating
**Solution:** Verify component props structure matches what the component expects

---

## Example: Complete Injection for One Component

```typescript
// Example: Injecting auroraImageHero component

// 1. Inject component files
await injectComponentFile('auroraImageHero', 'herobanners', 'edit', editContent);
await injectComponentFile('auroraImageHero', 'herobanners', 'prod', prodContent);
await injectComponentFile('auroraImageHero', 'herobanners', 'index', indexContent);

// 2. Update componentMap.tsx (read, modify, write)
const currentMap = await getFile('componentMap.tsx');
const updatedMap = addComponentToMap(currentMap, {
  type: 'auroraImageHero',
  category: 'herobanners',
  importName: 'AuroraImageHeroEdit',
  importPath: 'auroraImageHeroEdit',
});
await updateFile('componentMap.tsx', updatedMap);

// 3. Update componentDetails.ts (read, modify, write)
const currentDetails = await getFile('componentDetails.ts');
const updatedDetails = addComponentDetails(currentDetails, {
  type: 'auroraImageHero',
  category: 'herobanners',
  detailsExportName: 'auroraImageHeroDetails',
});
await updateFile('componentDetails.ts', updatedDetails);

// 4. websiteData.json already has component entry (from user's data)
// No action needed if component is already in websiteData.json
```

---

## Summary

The parent project must inject:

1. **Component Files** → `components/designs/{category}/{type}/`
2. **componentMap.tsx** → Register components for rendering
3. **componentDetails.ts** → Register component details for assistant
4. **websiteData.json** → User's website data with components

All component types in `websiteData.json` must:
- Have corresponding files in `components/designs/`
- Be registered in `componentMap.tsx`
- Be registered in `componentDetails.ts`

The development branch template is **blank** - parent project provides all component implementations and data.

