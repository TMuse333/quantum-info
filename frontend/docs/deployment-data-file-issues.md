# Deployment and Type Fixes - Change Log

This document tracks all changes made to fix deployment issues, type errors, and data file problems since the last commit.

---

## Component Props Made Optional

### Issue
Several component props were defined as required (`boolean`) but the data files sometimes didn't include them, causing TypeScript errors like:
- `Type 'boolean | undefined' is not assignable to type 'boolean'`
- `Type '{ ... }' is missing the following properties from type 'XProps': ...`

### Components Fixed

#### 1. ExperienceCard (`frontend/src/components/designs/contentPieces/experienceCard/experienceCard.tsx`)
**Changes:**
- Made `reverse` prop optional: `reverse?: boolean` (was `reverse: boolean`)
- Added default value in component: `reverse = false`

**Reason:** Data files may not always include the `reverse` property, causing type mismatches.

#### 2. ImageTextBox (`frontend/src/components/designs/contentPieces/imageTextBox/imageTextBox.tsx`)
**Changes:**
- Made `reverse` prop optional: `reverse?: boolean` (was `reverse: boolean`)
- Made `objectContain` prop optional: `objectContain?: boolean` (was `objectContain: boolean`)
- Default values should be added in component implementation (check if `false` is appropriate)

**Reason:** These layout properties may not always be specified in the data files.

#### 3. UniqueValueProposition (`frontend/src/components/designs/textComponents/valueProposition/valueProposition.tsx`)
**Changes:**
- Used `Omit<BaseComponentProps, 'subTitle' | 'images'>` to exclude conflicting properties
- Made `subTitle` optional: `subTitle?: string` (was `subTitle: string`)
- Made `images` optional with optional icons: `images?: { icon1?: ImageProp; ... }` (was required with all icons required)
- Made `textArray` optional: `textArray?: {...}[]` (was required)
- Added default values: `subTitle = ""`, `textArray = []`
- Added conditional rendering for `subTitle` and `textArray`
- Added conditional rendering for icons (only render if they exist)

**Reason:** The `services.data.ts` file was missing `images` and `textArray` properties, causing type errors. These are now optional to handle cases where they're not provided.

---

## Data File Corrections

### Issue: Duplicate Image Properties

### Problem
Generated data files (e.g., `index.data.ts`, `home.data.ts`) contain duplicate image properties:

**❌ Incorrect (Current):**
```typescript
export const component4Props: ImageTextBoxProps = {
  "images": {
    "main": {
      "src": "...",
      "alt": "Featured Image"
    }
  },
  "images.main": {  // ❌ DUPLICATE - Should not exist
    "src": "...",
    "alt": "Featured Image"
  },
  // ... other props
};
```

**✅ Correct (Expected):**
```typescript
export const component4Props: ImageTextBoxProps = {
  "images": {
    "main": {
      "src": "...",
      "alt": "Featured Image"
    }
  },
  // ... other props (no "images.main" property)
};
```

### Files Fixed
- `frontend/src/data/index.data.ts` - Removed duplicate `images.main` properties from:
  - `component2Props` (TextAndList)
  - `component3Props` (ExperienceCard)
  - `component4Props` (ImageTextBox)
- `frontend/src/data/services.data.ts` - Added missing `textArray` property to `component2Props` (MarketingShowcase)

### Root Cause
When component props are serialized using `JSON.stringify()`, if the source data has both:
- Nested structure: `images: { main: {...} }`
- Flat structure: `images.main: {...}` (from form data or API responses)

Both get serialized, creating duplicates. This happens when data comes from forms/APIs that use dot notation for nested properties.

### Impact
- TypeScript errors: Property `images.main` doesn't exist on the component props interface
- Runtime errors: Unexpected property access
- Build failures: Type mismatches
- Invalid JSON structure

### Solution
The data file generator needs to clean component props before serialization:

1. **Identify nested objects** (e.g., `images`, `bgLayout`)
2. **Collect nested property paths** (e.g., `images.main`, `images.secondary`)
3. **Remove flat properties** that duplicate nested structure
4. **Preserve only nested structure**

### Implementation Location
**File**: `frontend/src/lib/deploy/generators/generatePageFiles.ts`  
**Function**: `generateDataFile()`

**Fix Code:**
```typescript
// Before serialization, clean props:
function cleanComponentProps(props: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  const nestedKeys = new Set<string>();
  
  // First pass: identify nested structures
  for (const [key, value] of Object.entries(props)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      nestedKeys.add(key);
      cleaned[key] = value;
      // Collect nested paths (e.g., "images.main")
      for (const nestedKey of Object.keys(value)) {
        nestedKeys.add(`${key}.${nestedKey}`);
      }
    }
  }
  
  // Second pass: exclude flat duplicates
  for (const [key, value] of Object.entries(props)) {
    if (nestedKeys.has(key) && typeof value === 'object') continue;
    if (nestedKeys.has(key)) continue; // Skip "images.main" if "images" exists
    cleaned[key] = value;
  }
  
  return cleaned;
}

// Use in generateDataFile():
const cleanedProps = cleanComponentProps(component.props || {});
propsExports.push(`export const ${propsVarName}: ${propsTypeName} = ${JSON.stringify(cleanedProps, null, 2)};`);
```

### Files Affected
- `frontend/src/lib/deploy/generators/generatePageFiles.ts` - `generateDataFile()` function
- All generated `frontend/src/data/{pageSlug}.data.ts` files

### Additional Notes
- If multiple images are needed, they should be nested objects:
  ```typescript
  "images": {
    "main": { "src": "...", "alt": "..." },
    "secondary": { "src": "...", "alt": "..." }
  }
  ```
- Never use flat properties like `"images.main"` - always use nested structure
- This issue likely comes from form data or API responses that use dot notation for nested properties

---

## Additional Cleanup Tasks

### Remove Unnecessary Type Exports from `frontend/src/types/index.ts`

**Location**: `frontend/src/types/index.ts`

**Remove these exports:**
- Lines 5-7: 
  ```typescript
  export * from './templateTypes'
  export * from './llmOutputs'
  ```
- Lines 17-19:
  ```typescript
  export * from './website'
  export * from './user'
  ```

**Reason**: These types are not needed in production and may cause build errors or bloat the production bundle.

### Delete Unnecessary Type Files

**Files to delete:**
1. `src/types/websiteDataTypes.ts` (or `frontend/src/types/websiteDataTypes.ts` if it exists)
   - Contains types that are not needed in production
   - May reference editor-specific types

2. Component Registry files:
   - `src/types/registry/mainRegistry.ts` (or equivalent)
   - Any files containing `ComponentRegistry` or `COMPONENT_REGISTRY`
   - These are editor-specific and should not be deployed to production

**Reason**: These files are editor-specific and should not be included in the production deployment. They may cause build errors or type conflicts.

### Implementation Notes
- These cleanup tasks should be performed in the deployment code (e.g., `github-api-operations.ts`)
- The files should be filtered out during the production deployment process
- The `frontend/src/types/index.ts` should be cleaned/modified before being deployed to production

---

## Type Exports Cleanup

### Changes to `frontend/src/types/index.ts`

**Removed exports:**
- `export * from './templateTypes'` (line 5)
- `export * from './llmOutputs'` (line 7)
- `export * from './websiteDataTypes'` (removed)
- `export * from './website'` (line 17)
- `export * from './user'` (line 19)

**Remaining exports:**
- `export * from './colors'`
- `export * from './componentTypes'`
- `export * from './forms'`
- `export * from './navbar'`

**Reason:** These types are editor-specific and not needed in production. They may cause build errors or bloat the production bundle.

---

## Files Deleted

### Type Files Removed
1. **`frontend/src/types/websiteDataTypes.ts`**
   - Deleted: Contains editor-specific types that are not needed in production
   - May have referenced editor-specific types that cause build errors

2. **`frontend/src/types/registry/mainRegistry.ts`**
   - Deleted: Component registry is editor-specific
   - Contains `ComponentRegistryEntry` and `COMPONENT_REGISTRY` which are not needed in production

**Reason:** These files are editor-specific and should not be included in the production deployment. They may cause build errors or type conflicts.

---

## Summary of All Changes

### Modified Files
1. `frontend/src/components/designs/contentPieces/experienceCard/experienceCard.tsx`
   - Made `reverse` optional with default value

2. `frontend/src/components/designs/contentPieces/imageTextBox/imageTextBox.tsx`
   - Made `reverse` and `objectContain` optional

3. `frontend/src/components/designs/textComponents/valueProposition/valueProposition.tsx`
   - Made `subTitle`, `images`, and `textArray` optional
   - Added conditional rendering

4. `frontend/src/data/index.data.ts`
   - Removed duplicate `images.main` properties

5. `frontend/src/data/services.data.ts`
   - Added missing `textArray` property

6. `frontend/src/types/index.ts`
   - Removed unnecessary type exports

### Deleted Files
1. `frontend/src/types/websiteDataTypes.ts`
2. `frontend/src/types/registry/mainRegistry.ts`

### New Files
1. `frontend/docs/deployment-data-file-issues.md` (this file)

