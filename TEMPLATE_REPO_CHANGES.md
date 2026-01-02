# Template Repo Architectural Changes

This document summarizes the architectural changes that need to be applied to the `next-js-template` repository's `development` branch to match improvements made in child repositories.

## Overview

These changes improve:
- PageSwitcher visibility and UX
- Pages data structure handling (array to object transformation)
- Color palette functionality (darkText property)

---

## Change 1: Move PageSwitcher Outside EditorMode Conditional

**File:** `frontend/src/components/editor/EditorialPageWrapper.tsx`

**Current Code (lines 160-175):**
```tsx
return (
  <div className="relative">
    {/* Dashboard is always visible so users can toggle editor mode */}
    <Dashboard />
    
    {/* Other editor UI only shows when editor mode is on */}
    {editorMode && (
      <>
        <PageSwitcher />
        <HelperBotButton />
        <HelperBotPanel />
      </>
    )}

    {/* Debug panel - always visible */}
    <WebsiteDataDebugPanel />
```

**Updated Code:**
```tsx
return (
  <div className="relative">
    {/* Dashboard is always visible so users can toggle editor mode */}
    <Dashboard />
    
    {/* PageSwitcher is always visible (like parent project) */}
    <PageSwitcher />
    
    {/* Other editor UI only shows when editor mode is on */}
    {editorMode && (
      <>
        <HelperBotButton />
        <HelperBotPanel />
      </>
    )}

    {/* Debug panel - always visible */}
    <WebsiteDataDebugPanel />
```

**Why:** PageSwitcher should be always visible for easy page navigation, not just in editor mode.

---

## Change 2: Enhance PageSwitcher Component

**File:** `frontend/src/components/editor/pageSwitcher/pageSwitcher.tsx`

**Replace entire file with:**

```tsx
"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, X } from "lucide-react";
import useWebsiteStore from "@/stores/websiteStore";

export function PageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { websiteData } = useWebsiteStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const pages = websiteData?.pages || {};
  const pageArray = Object.values(pages);
  const currentPageSlug = pathname?.replace('/', '') || 'index';

  // If no pages, don't render
  if (pageArray.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-16 right-4 z-50 w-64"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Pages</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {pageArray.length}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                {pageArray.map((page, index) => {
                  const isActive = (page.slug || 'index') === currentPageSlug;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const slug = page.slug || 'index';
                        router.push(`/${slug}`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <FileText className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                      <span className="text-sm truncate">
                        {page.pageName || page.slug || `Page ${index + 1}`}
                      </span>
                      {isActive && (
                        <span className="ml-auto w-2 h-2 bg-indigo-600 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

**Key Improvements:**
- Expandable/collapsible functionality
- Active page highlighting
- Page count badge
- Better styling with gradient header
- Smooth animations
- Icons for better UX

---

## Change 3: Add Pages Array-to-Object Transformation

**File:** `frontend/src/stores/slices/websiteDataSlice.ts`

**Location:** Around line 182-200 (in the `loadFromGitHub` function)

**Current Code:**
```typescript
const data = await response.json();
console.log("✅ [websiteDataSlice] Loaded from GitHub:", {
  hasColorTheme: !!data.websiteData?.colorTheme,
  pagesCount: data.websiteData?.pages?.length || 0,
});

// Transform to WebsiteMaster
const websiteMaster: WebsiteMaster = {
  ...data.websiteData,
  templateName: data.websiteData?.templateName || "Default Template",
  formData: data.websiteData?.formData || {},
  status: data.websiteData?.status || "in-progress",
  pages: data.websiteData?.pages || [],
  colorTheme: data.websiteData?.colorTheme,
  seoMetadata: data.websiteData?.seoMetadata,
  currentVersionNumber: versionNumber || data.websiteData?.currentVersionNumber,
  createdAt: data.websiteData?.createdAt ? new Date(data.websiteData.createdAt) : new Date(),
  updatedAt: data.websiteData?.updatedAt ? new Date(data.websiteData.updatedAt) : new Date(),
};
```

**Updated Code:**
```typescript
const data = await response.json();
console.log("✅ [websiteDataSlice] Loaded from GitHub:", {
  hasColorTheme: !!data.websiteData?.colorTheme,
  pagesCount: Array.isArray(data.websiteData?.pages) 
    ? data.websiteData.pages.length 
    : Object.keys(data.websiteData?.pages || {}).length,
  pagesIsArray: Array.isArray(data.websiteData?.pages),
});

// Transform pages from array to object if needed
let pagesObject: Record<string, WebsitePage> = {};
if (Array.isArray(data.websiteData?.pages)) {
  // Convert array to object keyed by slug with intelligent slug generation
  data.websiteData.pages.forEach((page: WebsitePage, index: number) => {
    let slug: string;

    // Priority 1: Use existing slug if present
    if (page.slug) {
      slug = page.slug;
    }
    // Priority 2: Convert pageName to slug
    else if (page.pageName) {
      slug = page.pageName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    // Priority 3: Use index-based slug
    else {
      slug = index === 0 ? 'index' : `page-${index}`;
    }

    // Ensure uniqueness (handle duplicates)
    let uniqueSlug = slug;
    let counter = 1;
    while (pagesObject[uniqueSlug]) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Add the page with the unique slug
    pagesObject[uniqueSlug] = { ...page, slug: uniqueSlug };
  });
  console.log("🔄 [websiteDataSlice] Converted pages array to object:", Object.keys(pagesObject));
} else if (data.websiteData?.pages && typeof data.websiteData.pages === 'object') {
  // Already an object, use as-is
  pagesObject = data.websiteData.pages;
}

// Transform to WebsiteMaster
const websiteMaster: WebsiteMaster = {
  ...data.websiteData,
  templateName: data.websiteData?.templateName || "Default Template",
  formData: data.websiteData?.formData || {},
  status: data.websiteData?.status || "in-progress",
  pages: pagesObject,
  colorTheme: data.websiteData?.colorTheme,
  seoMetadata: data.websiteData?.seoMetadata,
  currentVersionNumber: versionNumber || data.websiteData?.currentVersionNumber,
  createdAt: data.websiteData?.createdAt ? new Date(data.websiteData.createdAt) : new Date(),
  updatedAt: data.websiteData?.updatedAt ? new Date(data.websiteData.updatedAt) : new Date(),
};
```

**Why:** GitHub API sometimes returns pages as an array without slugs. This transformation:
- Converts arrays to objects keyed by slug
- Generates slugs intelligently (slug → pageName → index)
- Handles duplicate slugs
- Ensures all pages are preserved

---

## Change 4: Add darkText Property to Color Palette

**File:** `frontend/src/lib/colorUtils/colorPalette.ts`

**Change 1: Update Interface (around line 4-10)**

**Current:**
```typescript
export interface DerivedColorPalette extends BaseColorProps {
    accentColor: string;           // Darker version of mainColor
    textHighlightColor: string;    // Same as mainColor for consistency
    gradientBg: string[];          // Array of shades from mainColor
    lightAccent: string;           // Lighter version for hover states
    darkAccent: string
  }
```

**Updated:**
```typescript
export interface DerivedColorPalette extends BaseColorProps {
    accentColor: string;           // Darker version of mainColor
    textHighlightColor: string;    // Same as mainColor for consistency
    gradientBg: string[];          // Array of shades from mainColor
    lightAccent: string;           // Lighter version for hover states
    darkAccent: string;
    darkText: string;              // Black text color in hex
  }
```

**Change 2: Update Return Object (around line 49-59)**

**Current:**
```typescript
return {
  baseBgColor,
  textColor,
  mainColor,
  bgLayout,
  accentColor: darkenHexColor(mainColor, 20),
  textHighlightColor: mainColor,
  gradientBg,
  lightAccent: lightenHexColor(mainColor, 30),
  darkAccent: darkenHexColor(mainColor, 30),
};
```

**Updated:**
```typescript
return {
  baseBgColor,
  textColor,
  mainColor,
  bgLayout,
  accentColor: darkenHexColor(mainColor, 20),
  textHighlightColor: mainColor,
  gradientBg,
  lightAccent: lightenHexColor(mainColor, 30),
  darkAccent: darkenHexColor(mainColor, 30),
  darkText: "#000000",
};
```

**Why:** Provides a consistent black text color (`#000000`) that components can use when they need dark text, avoiding hardcoded values.

---

## Verification Checklist

After applying changes, verify:

- [ ] PageSwitcher is visible even when editorMode is off
- [ ] PageSwitcher can be expanded/collapsed
- [ ] Active page is highlighted in PageSwitcher
- [ ] Pages array from GitHub is converted to object correctly
- [ ] All pages are preserved (not lost during transformation)
- [ ] `colors.darkText` is available in components
- [ ] No TypeScript errors
- [ ] No linting errors

---

## Testing

1. **Test PageSwitcher:**
   - Toggle editor mode on/off - PageSwitcher should always be visible
   - Click expand/collapse button - should animate smoothly
   - Click different pages - active page should highlight
   - Verify page count badge shows correct number

2. **Test Pages Transformation:**
   - Load data from GitHub with pages as array
   - Check console logs for transformation messages
   - Verify all pages appear in PageSwitcher
   - Navigate between pages - should work correctly

3. **Test darkText:**
   - Use `colors.darkText` in a component
   - Verify it returns `"#000000"`
   - Check TypeScript types are correct

---

## Commit Message

```
feat: improve PageSwitcher and add pages array transformation

- Move PageSwitcher outside editorMode conditional (always visible)
- Enhance PageSwitcher with expandable/collapsible UI and active page highlighting
- Add intelligent pages array-to-object transformation with slug generation
- Add darkText property to DerivedColorPalette for consistent black text color
```

---

## Files Modified

1. `frontend/src/components/editor/EditorialPageWrapper.tsx`
2. `frontend/src/components/editor/pageSwitcher/pageSwitcher.tsx`
3. `frontend/src/stores/slices/websiteDataSlice.ts`
4. `frontend/src/lib/colorUtils/colorPalette.ts`

---

**Status:** Ready to apply  
**Branch:** `development`  
**Priority:** High - These are core architectural improvements

