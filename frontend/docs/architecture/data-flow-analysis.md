# Data Flow & State Management Analysis

## Current Architecture Overview

### Data Sources (Source of Truth)
1. **GitHub** (`websiteData.json`) - The ultimate source of truth
2. **`websiteMasterStore`** (Zustand) - Cached copy of GitHub data
3. **`websiteStore`** (Zustand) - Current page's components in memory
4. **`editHistoryStore`** (Zustand, persisted) - Tracks all edits

### Key Files
- `websiteData.json` - Stored in GitHub, contains: `pages`, `colorTheme`, `formData`, etc.
- `websiteMasterStore.ts` - Manages the full website data
- `websiteStore.ts` - Manages current page components
- `useWebsiteLoader.ts` - Loads data from GitHub
- `useWebsiteSave.ts` - Saves data to GitHub
- `EditorialPageWrapper.tsx` - Applies theme to components

---

## Current Data Flow

### On Page Load
```
1. Page loads
   ↓
2. useWebsiteLoader.ts runs
   ↓
3. Fetches from GitHub API (/api/versions/get-latest)
   ↓
4. Transforms data → websiteMasterStore.setMaster()
   ↓
5. EditorialPageWrapper initializes
   ↓
6. Sets components in websiteStore
   ↓
7. EditorialPageWrapper theme sync effect runs
   ↓
8. Applies theme to components (calls updateComponentProps)
   ↓
9. updateComponentProps logs to editHistoryStore ❌ PROBLEM
```

### On Theme Change
```
1. User changes theme in generalOverviewPanel
   ↓
2. handleSaveTheme() updates websiteMaster.colorTheme
   ↓
3. Updates all components via updateComponentProps()
   ↓
4. EditorialPageWrapper theme sync effect detects change
   ↓
5. Applies theme again (calls updateComponentProps) ❌ DUPLICATE
   ↓
6. More edits logged to editHistoryStore ❌ PROBLEM
```

### On Save
```
1. User clicks "Save Current Changes"
   ↓
2. useWebsiteSave.handleConfirmSave()
   ↓
3. Merges websiteStore.currentPageData.components into websiteMaster
   ↓
4. Commits to GitHub
   ↓
5. Reloads from GitHub (setMaster)
   ↓
6. EditorialPageWrapper theme sync runs again
   ↓
7. Applies theme (calls updateComponentProps) ❌ ADDS MORE EDITS
   ↓
8. markAsSaved() called (but too late - edits already added)
```

---

## Problems Identified

### Problem 1: Theme Sync Creates Edits on Every Load
**Location**: `EditorialPageWrapper.tsx` lines 77-135

**Issue**: Every time the page loads or theme changes, the theme sync effect runs and calls `updateComponentProps()`, which logs edits to `editHistoryStore`, even though these are automatic syncs, not user edits.

**Current Fix Attempt**: Using `source: 'theme-sync'` and skipping in `websiteStore.ts`, but timing issues mean edits are still being added.

### Problem 2: Multiple Theme Applications
**Issue**: Theme is applied multiple times:
1. Initial load from GitHub
2. Theme sync in EditorialPageWrapper
3. After save/reload
4. When user manually changes theme

Each application can trigger the sync effect again.

### Problem 3: Edit History Accumulation
**Issue**: 
- Theme sync edits are being logged (even with the skip, timing issues)
- Every refresh adds 6 edits (one per component on the page)
- `markAsSaved()` is called, but new edits are added after it

### Problem 4: Theme Cycling
**Issue**: Theme appears to cycle:
1. Original theme loads (from GitHub)
2. Current theme applies (from store)
3. Default theme shows (fallback)

This suggests the theme sync is running multiple times with different data sources.

---

## Simplified Architecture Proposal

### Core Principle
**GitHub is the source of truth. Everything else is a cache.**

### Proposed Flow

#### Load Flow (Simplified)
```
1. Page loads
   ↓
2. Fetch websiteData.json from GitHub
   ↓
3. Set websiteMasterStore (complete data)
   ↓
4. Extract current page → websiteStore
   ↓
5. Render components (they read from websiteStore)
   ↓
6. NO automatic theme sync - components use their props from GitHub
```

#### Save Flow (Simplified)
```
1. User makes changes (edits components)
   ↓
2. Changes update websiteStore
   ↓
3. On save: Merge websiteStore → websiteMaster
   ↓
4. Commit websiteMaster to GitHub
   ↓
5. Reload from GitHub (fresh start)
   ↓
6. NO theme sync needed - data is already correct
```

#### Theme Change Flow (Simplified)
```
1. User changes theme in UI
   ↓
2. Update websiteMaster.colorTheme
   ↓
3. Update all components in websiteStore (one-time)
   ↓
4. Update websiteMaster.pages[slug].components (for persistence)
   ↓
5. Save to GitHub
   ↓
6. NO automatic sync after reload - data is already correct
```

---

## Key Changes Needed

### 1. Remove Automatic Theme Sync
**File**: `EditorialPageWrapper.tsx`

**Current**: Has a `useEffect` that automatically applies theme when `websiteMaster.colorTheme` changes.

**Proposed**: Remove this. Components should use their props directly from GitHub data. Theme should only be applied when:
- User explicitly changes theme
- Initial load (if components don't have colors)

### 2. Fix Edit Tracking
**File**: `websiteStore.ts`

**Current**: All `updateComponentProps` calls log to edit history.

**Proposed**: Only log user-initiated changes:
- Manual edits (user typing, clicking)
- AI assistant edits
- NOT theme syncs
- NOT initial loads

### 3. Simplify Data Loading
**File**: `useWebsiteLoader.ts`

**Current**: Complex logic with sessionStorage, caching, etc.

**Proposed**: 
- Always fetch from GitHub on initial load
- Simple transformation
- Set websiteMasterStore
- Extract current page to websiteStore

### 4. Fix Save Timing
**File**: `useWebsiteSave.ts`

**Current**: `markAsSaved()` called after reload, but theme sync adds edits after.

**Proposed**:
- Mark as saved BEFORE reload
- OR prevent theme sync from running after save
- OR mark as saved with a timestamp that includes a small buffer

---

## Data Structure

### websiteData.json (GitHub)
```json
{
  "pages": {
    "index": {
      "id": "index",
      "slug": "index",
      "components": [
        {
          "id": "hero-1",
          "type": "auroraImageHero",
          "props": {
            "mainColor": "#b51a00",
            "textColor": "#ffffff",
            "baseBgColor": "#000000",
            "bgLayout": { "type": "radial" },
            "title": "Welcome",
            "description": "..."
          }
        }
      ]
    }
  },
  "colorTheme": {
    "primary": "#b51a00",
    "secondary": "#b51a00",
    "text": "#ffffff",
    "background": "#000000",
    "bgLayout": { "type": "radial" }
  },
  "formData": {},
  "templateName": "..."
}
```

### websiteMasterStore
- Contains the full `websiteData.json` structure
- Source of truth in memory
- Synced with GitHub

### websiteStore
- Contains only current page's data
- `currentPageData.components[]` - array of components with props
- Used by components for rendering

---

## Edit Tracking Logic

### What Should Be Tracked
✅ User typing in text fields
✅ User changing colors manually
✅ AI assistant making changes
✅ Claude Code structural changes

### What Should NOT Be Tracked
❌ Theme sync on page load
❌ Initial component prop loading
❌ Automatic theme application
❌ Data reload from GitHub

### Current Problem
Theme sync is calling `updateComponentProps()` which logs edits, even though we try to skip `theme-sync` source. The timing means edits are logged before the skip check.

---

## Recommended Solution

### Option A: Remove Theme Sync Entirely (Recommended)
1. Remove the theme sync `useEffect` from `EditorialPageWrapper.tsx`
2. Components always use their props from GitHub
3. When user changes theme, update components directly (one-time)
4. Save to GitHub
5. On reload, components already have correct colors

**Pros**: Simple, no timing issues, no duplicate edits
**Cons**: Need to ensure components always have colors on initial load

### Option B: Fix Theme Sync Timing
1. Keep theme sync but make it smarter
2. Only sync if components are missing colors
3. Don't sync if components already have colors matching theme
4. Mark as saved with future timestamp to catch late edits

**Pros**: Handles edge cases
**Cons**: More complex, still has timing issues

### Option C: Separate Edit Tracking
1. Create separate tracking for "user edits" vs "system syncs"
2. Only count user edits as "unsaved"
3. System syncs don't affect unsaved count

**Pros**: More granular control
**Cons**: More complex state management

---

## Implementation Checklist

### Immediate Fixes
- [ ] Remove or fix theme sync in `EditorialPageWrapper.tsx`
- [ ] Ensure `updateComponentProps` with `source: 'theme-sync'` is never logged
- [ ] Fix `markAsSaved()` timing to prevent late edits
- [ ] Add logging to track when edits are added

### Long-term Improvements
- [ ] Simplify data loading (remove complex caching)
- [ ] Ensure components always have colors on initial load
- [ ] Make theme changes update components directly (not via sync)
- [ ] Test save → reload → verify no new edits

---

## Debugging Steps

1. **Check edit history**: Look at `editHistoryStore.history` to see what's being logged
2. **Check timestamps**: Compare edit timestamps vs `lastSavedTimestamp`
3. **Check theme sync**: Add logging to see when theme sync runs
4. **Check component props**: Verify components have correct colors after load

---

## Questions to Answer

1. Should components always have colors from GitHub, or should theme be applied on load?
2. Should theme sync happen automatically, or only when user changes theme?
3. Should we track all prop changes, or only user-initiated ones?
4. What's the simplest way to ensure data consistency?

---

## Specific Code Issues Found

### Issue 1: Theme Sync Runs on Every Load
**File**: `EditorialPageWrapper.tsx:77-137`

**Problem**: The `useEffect` runs whenever `themeHash` changes. On every page load:
1. GitHub data loads → `websiteMaster.colorTheme` set
2. `themeHash` computed → changes
3. Effect runs → applies theme to all components
4. `updateComponentProps` called 6 times (one per component)
5. Even though we skip `theme-sync`, the timing might cause issues

**Evidence**: User reports "6 more unsaved things" on every refresh = 6 components being updated

### Issue 2: Type Assertion Bypasses Type Safety
**File**: `EditorialPageWrapper.tsx:111`

```typescript
updateComponentProps(comp.id, updatedProps, { source: 'theme-sync' as any });
```

**Problem**: Using `as any` bypasses TypeScript checking. The `source` type might not include `'theme-sync'`, so the check in `websiteStore.ts` might not work correctly.

### Issue 3: Check Happens After State Update
**File**: `websiteStore.ts:129`

**Problem**: The check `metadata?.source !== 'theme-sync'` happens AFTER `set()` is called, which means the component state is updated. If the check fails for any reason, the edit is still logged.

### Issue 4: Multiple Data Sources for Theme
**Problem**: Theme can come from:
1. GitHub (`websiteData.json`)
2. `websiteMaster.colorTheme` (in-memory)
3. Component props (individual component colors)
4. Default fallbacks

This creates confusion about which is the "real" theme.

### Issue 5: Theme Sync Timing Race Condition
**Problem**: 
1. Save completes → `markAsSaved()` called
2. Reload happens → `setMaster()` called
3. Theme sync effect triggers → adds edits
4. Edits have timestamp AFTER `lastSavedTimestamp`
5. Shows as unsaved

Even with the 1.5s delay, if theme sync runs after, it still adds edits.

---

## Root Cause Analysis

### Why 6 Edits on Every Refresh?
1. Page has 6 components
2. Theme sync runs on load
3. Calls `updateComponentProps` for each component
4. Even with `theme-sync` skip, something is logging them

### Why Theme Cycles?
1. Initial load: Components have colors from GitHub
2. Theme sync runs: Overwrites with theme colors
3. Another sync runs: Maybe with different data?
4. Fallback: If theme missing, uses defaults

### Why Unsaved Count Doesn't Clear?
1. `markAsSaved()` sets timestamp
2. But theme sync runs AFTER (even with delay)
3. New edits have later timestamps
4. `getUnsavedEdits()` returns them

---

## Recommended Immediate Fix

### Quick Fix: Disable Theme Sync Entirely
Remove the theme sync `useEffect` from `EditorialPageWrapper.tsx` and ensure:

1. **Components always load with colors from GitHub**
   - When loading from GitHub, components should already have `mainColor`, `textColor`, etc. in their props
   - No need to "apply" theme - it's already there

2. **Theme changes update components directly**
   - When user changes theme in `generalOverviewPanel`, update components immediately
   - Save to GitHub
   - On reload, components already have correct colors

3. **No automatic sync needed**
   - If components have colors, use them
   - If they don't, that's a data issue (shouldn't happen)

### Implementation
```typescript
// REMOVE this entire useEffect from EditorialPageWrapper.tsx:
// Lines 60-137 - the theme sync effect

// KEEP: Only apply theme when user explicitly changes it
// This happens in generalOverviewPanel.handleSaveTheme()
```

---

## Next Steps

1. **Immediate**: Remove theme sync effect, test if components load with colors
2. **Verify**: Check if GitHub data includes component colors
3. **Fix**: If components don't have colors in GitHub, ensure they're saved with colors
4. **Test**: 
   - Load page → should have colors, 0 unsaved
   - Change theme → should update, 1+ unsaved
   - Save → should be 0 unsaved
   - Reload → should still be 0 unsaved

---

## Data Flow Diagram (Simplified)

```
┌─────────────┐
│   GitHub    │ (Source of Truth)
│websiteData  │
│   .json     │
└──────┬──────┘
       │
       │ Fetch on load
       ↓
┌──────────────────┐
│ websiteMasterStore│ (Full website data)
│  - pages          │
│  - colorTheme     │
│  - formData       │
└──────┬───────────┘
       │
       │ Extract current page
       ↓
┌──────────────────┐
│  websiteStore    │ (Current page only)
│  - components[]  │ (with props including colors)
└──────┬───────────┘
       │
       │ Components read from here
       ↓
┌──────────────────┐
│  Components      │ (Render with colors)
│  (Editorial)     │
└──────────────────┘

User edits → websiteStore → Save → websiteMaster → GitHub
```

**Key Point**: Colors should be IN the component props from GitHub, not applied separately.

