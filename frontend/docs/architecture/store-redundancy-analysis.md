# Store Redundancy Analysis

## Critical Issue: `websiteData.json` Upload Source

The file `frontend/src/data/websiteData.json` (or `src/data/websiteData.json` in non-monorepo) is the **source of truth** that gets uploaded to GitHub. However, **three different stores** maintain separate copies of this data, leading to potential sync issues.

## The Three Stores

### 1. `useWebsiteMasterStore` (Legacy)
- **Data**: `websiteMaster: WebsiteMaster | null`
- **Purpose**: Simple read/write store
- **Features**: `setMaster`, `updateMaster`, `initializeFromGitHub`, `refreshFromGitHub`
- **Editing**: ❌ No `updateComponentProps`
- **Saving**: ❌ Cannot save to GitHub
- **Usage**: ~12 files (legacy components)
- **Status**: **REDUNDANT** - No editing capabilities, being phased out

### 2. `useWebsiteEditStore` (Newer)
- **Data**: `websiteData: WebsiteMaster | null`
- **Purpose**: Editing-focused store
- **Features**: `updateComponentProps`, `loadFromGitHub`, `saveToGitHub`, UI state
- **Editing**: ✅ Full editing support
- **Saving**: ✅ **THIS IS WHAT ACTUALLY SAVES TO GITHUB**
- **Usage**: ~5 files (newer components, `useWebsiteSave.ts`)
- **Status**: **ACTIVE** - Currently the source for GitHub uploads

### 3. `useWebsiteStore` (Most Used)
- **Data**: `websiteData: WebsiteMaster | null`
- **Purpose**: Unified store with slices
- **Features**: `updateComponentProps`, `loadFromGitHub`, `saveToGitHub`, `hasUnsavedChanges`, caching
- **Editing**: ✅ Full editing support
- **Saving**: ✅ Can save to GitHub (but not currently used for saves)
- **Usage**: ~45 files (most components, debug panel)
- **Status**: **MOST WIDELY USED** - But not the save source

## The Problem

### Upload Disconnect

**What gets saved to GitHub:**
- Source: `useWebsiteEditStore.websiteData`
- Location: `frontend/src/hooks/useWebsiteSave.ts` line 64
- Method: `newStore.saveToGitHub()` (line 119)

**What the debug panel shows:**
- Source: `useWebsiteStore.websiteData`
- Location: `frontend/src/components/editor/debug/WebsiteDataDebugPanel.tsx` line 10

**Result**: The debug panel shows data from `useWebsiteStore`, but GitHub uploads use `useWebsiteEditStore`. These can be **out of sync**, causing:
- ✅ Panel shows correct data
- ❌ But that data never gets uploaded
- ❌ Different data gets uploaded instead

## Data Flow Issue

```
GitHub (websiteData.json)
    ↓
[Load] → useWebsiteEditStore.websiteData  ← Used for editing
[Load] → useWebsiteStore.websiteData       ← Used for display
[Load] → useWebsiteMasterStore.websiteMaster ← Legacy

[Edit] → useWebsiteEditStore.updateComponentProps()  ✅ Updates this store
[Edit] → useWebsiteStore.updateComponentProps()      ✅ Updates this store
[Edit] → useWebsiteMasterStore.updateMaster()       ❌ No component editing

[Save] → useWebsiteEditStore.saveToGitHub()  ✅ THIS IS WHAT SAVES
[Save] → useWebsiteStore.saveToGitHub()      ❌ Not used
[Save] → useWebsiteMasterStore              ❌ Cannot save
```

## Recommendation

### Immediate Fix
1. **Update `WebsiteDataDebugPanel`** to read from `useWebsiteEditStore` instead of `useWebsiteStore` so it shows what will actually be uploaded.

### Long-term Solution
1. **Consolidate to `useWebsiteStore`** (most widely used, has caching and unsaved changes tracking)
2. **Migrate `useWebsiteEditStore` features** into `useWebsiteStore`
3. **Remove `useWebsiteMasterStore`** (legacy, no editing)
4. **Update all components** to use the single unified store

### Why `useWebsiteStore`?
- ✅ Most widely used (45 files vs 5 files)
- ✅ Has `hasUnsavedChanges` tracking
- ✅ Has caching support
- ✅ Already has all editing features
- ✅ Better architecture (slice-based)

## Files That Need Attention

### Critical (Upload Source)
- `frontend/src/hooks/useWebsiteSave.ts` - Uses `useWebsiteEditStore` for saves
- `frontend/src/stores/websiteEditStore.ts` - The actual save source

### Display (Out of Sync)
- `frontend/src/components/editor/debug/WebsiteDataDebugPanel.tsx` - Shows wrong store

### Migration Needed
- All 27 `*Edit.tsx` components - Currently use `useWebsiteStore` but saves use `useWebsiteEditStore`
- `frontend/src/lib/hooks/hooks.ts` - Uses `useWebsiteStore` for syncing

## Summary

**The main concern**: `websiteData.json` uploads are coming from `useWebsiteEditStore`, but most of the app (including the debug panel) reads from `useWebsiteStore`. This creates a disconnect where:
- Edits might update one store but not the other
- The debug panel shows data that won't be uploaded
- The actual upload might contain stale or different data

**Solution**: Either sync both stores on every update, or consolidate to a single store.

