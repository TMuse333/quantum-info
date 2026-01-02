# Development Branch Analysis & Setup Guide

**Purpose:** Analyze differences between `experiment` (sample/test data) and `development` (empty template) branches, and provide guidance on what structure should exist in the development branch to enable easy component/data injection via GitHub API.

**Date:** 2025-12-27

---

## Executive Summary

The `development` branch should be a **minimal but complete template** that:
1. ✅ Has the folder structure ready for components
2. ✅ Has empty/blank component files (stubs) or just the folder structure
3. ✅ Has a blank `websiteData.json` with proper schema
4. ✅ Has all the infrastructure files (PageRenderer, componentMap, etc.)
5. ❌ Does NOT have actual component implementations (those come from parent project)
6. ❌ Does NOT have populated websiteData.json (that comes from parent project)

---

## Branch Comparison: Experiment vs Development

### Key Differences

| Aspect | Development Branch | Experiment Branch |
|--------|-------------------|-------------------|
| **Design Components** | 0 files | 31 files (full implementations) |
| **websiteData.json** | Blank template (empty components array) | Populated with test data |
| **Component Structure** | Folder structure may not exist | Complete folder structure |
| **Purpose** | Template for new users | Sample/test website |

### File Count Analysis

```
Development Branch:
- components/designs/: 0 files
- components/pageComponents/: Exists (infrastructure)
- data/websiteData.json: Exists (blank template)

Experiment Branch:
- components/designs/: 31 files (all component implementations)
- components/pageComponents/: Exists (infrastructure)
- data/websiteData.json: Exists (populated with test data)
```

---

## Required Structure in Development Branch

### 1. Folder Structure (Must Exist)

The development branch **MUST** have the following folder structure, even if empty:

```
frontend/src/
├── components/
│   ├── designs/                    # ✅ MUST EXIST (can be empty or have stubs)
│   │   ├── herobanners/
│   │   │   └── index.ts            # ✅ Export file
│   │   ├── contentPieces/
│   │   │   └── index.ts            # ✅ Export file
│   │   ├── textComponents/
│   │   │   └── index.ts            # ✅ Export file
│   │   ├── testimonials/
│   │   │   └── index.ts            # ✅ Export file
│   │   └── index.ts                # ✅ Main export file
│   │
│   └── pageComponents/             # ✅ MUST EXIST (infrastructure)
│       ├── PageRenderer.tsx        # ✅ Core rendering logic
│       ├── componentMap.tsx        # ✅ Component type mapping
│       ├── homepage.tsx            # ✅ Homepage wrapper
│       ├── pages.ts                # ✅ Page definitions
│       └── index.ts                # ✅ Exports
│
└── data/
    └── websiteData.json             # ✅ MUST EXIST (blank template)
```

### 2. Component Folder Structure Options

You have **two approaches** for the `designs/` folder:

#### Option A: Empty Folders + Index Files (Recommended)
```
components/designs/
├── herobanners/
│   └── index.ts                    # export {}; (empty export)
├── contentPieces/
│   └── index.ts                    # export {}; (empty export)
├── textComponents/
│   └── index.ts                    # export {}; (empty export)
├── testimonials/
│   └── index.ts                    # export {}; (empty export)
└── index.ts                        # Re-exports from subfolders
```

**Pros:**
- ✅ Parent project can inject components directly
- ✅ No stub files to manage
- ✅ Cleaner template

**Cons:**
- ⚠️ componentMap.tsx needs to handle missing components gracefully

#### Option B: Stub Component Files
```
components/designs/
├── herobanners/
│   └── auroraImageHero/
│       ├── auroraImageHeroEdit.tsx  # Stub (empty component)
│       ├── auroraImageHero.prod.tsx  # Stub (empty component)
│       └── index.ts                  # Exports
└── ...
```

**Pros:**
- ✅ componentMap.tsx can import without errors
- ✅ TypeScript won't complain about missing imports

**Cons:**
- ⚠️ Parent project needs to overwrite stub files
- ⚠️ More files to manage

**Recommendation:** Use **Option A** (empty folders) - it's cleaner and the parent project can inject complete component files.

### 3. componentMap.tsx Structure

The `componentMap.tsx` file should exist but handle missing components gracefully:

```typescript
// components/pageComponents/componentMap.tsx

import React from "react";
import { EditorialComponentProps } from "@/types/templateTypes";

// Dynamic imports with fallbacks
let AuroraImageHeroEdit: React.ComponentType<EditorialComponentProps> | null = null;
try {
  AuroraImageHeroEdit = require("@/components/designs/herobanners/auroraImageHero/auroraImageHeroEdit").default;
} catch (e) {
  console.warn("Component not found: auroraImageHero");
}

// ... repeat for other components

export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {
  auroraImageHero: AuroraImageHeroEdit || (() => <div>Component loading...</div>),
  textAndList: TextAndListEdit || (() => <div>Component loading...</div>),
  // ... etc
};
```

**Better Approach:** Use dynamic imports at render time:

```typescript
export function createRenderComponent() {
  return (component: any) => {
    const Component = componentMap[component.type];
    if (!Component) {
      // Try dynamic import
      return <DynamicComponentLoader type={component.type} />;
    }
    return <Component id={component.id} />;
  };
}
```

### 4. websiteData.json Template

The development branch should have a **blank but valid** `websiteData.json`:

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
    "bgLayout": {
      "type": "solid"
    }
  },
  "seoMetadata": {},
  "pages": {
    "index": {
      "id": "index",
      "name": "Home",
      "path": "/",
      "components": []  // ✅ EMPTY - parent project will populate
    }
  },
  "deployment": {
    "githubOwner": "",
    "githubRepo": "",
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
  "ownerId": "",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Key Points:**
- ✅ Has all required fields
- ✅ `pages.index.components` is an empty array
- ✅ Parent project will replace this entire file

---

## What Parent Project Needs to Inject

### 1. Component Files (via GitHub API)

The parent project should inject component files into the `components/designs/` folder structure:

```
components/designs/
├── herobanners/
│   └── auroraImageHero/
│       ├── auroraImageHeroEdit.tsx    # ← Inject this
│       ├── auroraImageHero.prod.tsx   # ← Inject this
│       └── index.ts                    # ← Inject this
├── contentPieces/
│   ├── experienceCard/
│   │   ├── experienceCardEdit.tsx      # ← Inject this
│   │   ├── experienceCard.prod.tsx    # ← Inject this
│   │   └── index.ts                    # ← Inject this
│   └── ...
└── ...
```

**Injection Strategy:**
1. Parent project has a library of component files
2. For each component type in `websiteData.json`, inject the corresponding component files
3. Use GitHub API to create/update files in the user's repo
4. Update `componentMap.tsx` to include the new components

### 2. websiteData.json (via GitHub API)

The parent project should inject a populated `websiteData.json`:

```json
{
  "templateName": "Default Template",
  "pages": {
    "index": {
      "id": "index",
      "name": "Home",
      "path": "/",
      "components": [
        {
          "id": "hero-1",
          "type": "auroraImageHero",  // ← Must match componentMap key
          "order": 0,
          "props": { /* ... */ }
        },
        {
          "id": "text-1",
          "type": "textAndList",      // ← Must match componentMap key
          "order": 1,
          "props": { /* ... */ }
        }
      ]
    }
  }
}
```

**Key Points:**
- ✅ `component.type` must match a key in `componentMap.tsx`
- ✅ Components are ordered by `order` field
- ✅ Each component has unique `id`

### 3. componentMap.tsx Updates

After injecting components, update `componentMap.tsx`:

```typescript
// Add imports for injected components
import AuroraImageHeroEdit from "@/components/designs/herobanners/auroraImageHero/auroraImageHeroEdit";
import { TextAndListEdit } from "@/components/designs/textComponents/textAndList";
// ... etc

export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {
  auroraImageHero: AuroraImageHeroEdit,
  textAndList: TextAndListEdit,
  // ... etc
};
```

---

## Recommended Development Branch Setup

### Step 1: Ensure Folder Structure Exists

```bash
# Create folder structure (if not exists)
mkdir -p frontend/src/components/designs/{herobanners,contentPieces,textComponents,testimonials}
mkdir -p frontend/src/components/pageComponents
mkdir -p frontend/src/data
```

### Step 2: Create Empty Index Files

Create minimal index files in each design subfolder:

```typescript
// components/designs/herobanners/index.ts
export {};

// components/designs/contentPieces/index.ts
export {};

// components/designs/textComponents/index.ts
export {};

// components/designs/testimonials/index.ts
export {};

// components/designs/index.ts
export * from './herobanners';
export * from './contentPieces';
export * from './textComponents';
export * from './testimonials';
```

### Step 3: Ensure componentMap.tsx Handles Missing Components

```typescript
// components/pageComponents/componentMap.tsx
import React from "react";
import { EditorialComponentProps } from "@/types/templateTypes";

// Use dynamic imports or try/catch for optional components
const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {};

// Helper to dynamically load components
async function loadComponent(type: string) {
  try {
    switch (type) {
      case 'auroraImageHero':
        return (await import('@/components/designs/herobanners/auroraImageHero/auroraImageHeroEdit')).default;
      case 'textAndList':
        return (await import('@/components/designs/textComponents/textAndList')).TextAndListEdit;
      // ... etc
      default:
        return null;
    }
  } catch (e) {
    console.warn(`Component ${type} not found`);
    return null;
  }
}

export function createRenderComponent() {
  return async (component: any) => {
    const Component = await loadComponent(component.type);
    if (!Component) {
      return <div>Component {component.type} not found</div>;
    }
    return <Component id={component.id} />;
  };
}

export default componentMap;
```

**Note:** This approach allows components to be injected later without breaking the app.

### Step 4: Ensure websiteData.json Template Exists

Ensure `frontend/src/data/websiteData.json` exists with the blank template shown above.

---

## Parent Project Injection Workflow

### Recommended Flow

1. **Create User Repo from Development Branch**
   ```bash
   # Parent project creates repo from development branch template
   gh repo create user123-website --template next-js-template --branch development
   ```

2. **Inject Component Files**
   ```typescript
   // Parent project code
   const componentsToInject = [
     'herobanners/auroraImageHero',
     'textComponents/textAndList',
     'contentPieces/experienceCard',
     // ... based on websiteData.json component types
   ];
   
   for (const componentPath of componentsToInject) {
     await githubAPI.createFile({
       owner: 'user123',
       repo: 'user123-website',
       path: `frontend/src/components/designs/${componentPath}/componentFile.tsx`,
       content: getComponentFileContent(componentPath),
       branch: 'development'
     });
   }
   ```

3. **Inject websiteData.json**
   ```typescript
   await githubAPI.updateFile({
     owner: 'user123',
     repo: 'user123-website',
     path: 'frontend/src/data/websiteData.json',
     content: JSON.stringify(populatedWebsiteData, null, 2),
     branch: 'development'
   });
   ```

4. **Update componentMap.tsx**
   ```typescript
   // Read current componentMap.tsx
   const currentMap = await githubAPI.getFile('componentMap.tsx');
   
   // Add imports and entries for injected components
   const updatedMap = addComponentsToMap(currentMap, injectedComponents);
   
   // Update file
   await githubAPI.updateFile({
     path: 'frontend/src/components/pageComponents/componentMap.tsx',
     content: updatedMap,
     branch: 'development'
   });
   ```

---

## Key Recommendations

### ✅ DO:

1. **Keep development branch minimal** - Only infrastructure, no actual components
2. **Use empty folder structure** - Easier to inject into
3. **Make componentMap dynamic** - Handle missing components gracefully
4. **Validate component types** - Ensure websiteData.json component types match available components
5. **Use consistent naming** - Component type in websiteData.json must match componentMap key

### ❌ DON'T:

1. **Don't include test/sample components** - Development branch should be clean
2. **Don't hardcode component imports** - Use dynamic imports or try/catch
3. **Don't skip folder structure** - Even if empty, folders should exist
4. **Don't forget index.ts files** - Needed for clean imports
5. **Don't populate websiteData.json** - Keep it blank for parent project to fill

---

## Testing the Setup

### Verify Development Branch is Ready

1. **Check folder structure exists:**
   ```bash
   ls -R frontend/src/components/designs/
   ```

2. **Check websiteData.json is blank:**
   ```bash
   cat frontend/src/data/websiteData.json | jq '.pages.index.components'
   # Should output: []
   ```

3. **Check componentMap handles missing components:**
   ```bash
   # Start dev server
   npm run dev
   # Should not crash even with no components
   ```

4. **Test injection:**
   - Inject one component file via GitHub API
   - Update componentMap.tsx
   - Update websiteData.json
   - Verify page renders correctly

---

## Summary

The development branch should be a **minimal template** with:
- ✅ Complete folder structure (can be empty)
- ✅ Infrastructure files (PageRenderer, componentMap, etc.)
- ✅ Blank websiteData.json template
- ❌ No actual component implementations
- ❌ No populated website data

The parent project then injects:
1. Component files into `components/designs/`
2. Populated `websiteData.json`
3. Updates to `componentMap.tsx`

This approach makes it easy to:
- Create new user repos from a clean template
- Inject only the components needed for each user
- Keep the template minimal and maintainable
- Support different component sets per user

