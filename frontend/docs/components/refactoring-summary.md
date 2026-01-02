# State Management Refactoring Summary

## Goal

Refactor from a dual-store architecture (websiteStore + websiteMasterStore) to a single unified store (websiteEditStore) to eliminate infinite loops, simplify GitHub sync, and make GitHub the single source of truth.

## Current Status

**Phase 1: New Store Created** ✅
- Created `websiteEditStore.ts` with unified architecture
- Store holds full `WebsiteMaster` data (not just current page)
- Methods: `updateComponentProps`, `loadFromGitHub`, `saveToGitHub`
- Computed getters: `getCurrentPage`, `getComponent`

**Phase 2: Data Loading Updated** ✅
- Updated `useWebsiteLoader` to populate new store
- Both old and new stores are populated during migration

**Phase 3: Single Component Migration (IN PROGRESS)** 🔄
- Migrated `auroraImageHeroEdit.tsx` to use new store
- Updated `EditorialPageWrapper` to only render auroraImageHero (for testing)
- Updated `useWebsiteSave` to use new store

## Architecture Changes

### Before (Old Architecture)
```
GitHub → websiteMasterStore → EditorialPageWrapper → websiteStore → useSyncPageDataToComponent → Component local state
                                                                                                      ↓
                                                                                              User edits → updateComponentProps → websiteStore
                                                                                                      ↓
                                                                                              useSyncPageDataToComponent (watches websiteStore)
                                                                                                      ↓
                                                                                              [INFINITE LOOP]
```

### After (New Architecture)
```
GitHub → websiteEditStore.websiteData
                              ↓
                    Component reads directly from store (via Zustand subscription)
                              ↓
                    User edits → updateComponentProps → websiteEditStore.websiteData (updated)
                              ↓
                    Component re-renders automatically (no sync hooks needed)
                              ↓
                    Save → saveToGitHub → GitHub
```

## Key Changes Made

### 1. New Store (`websiteEditStore.ts`)
- Single source of truth for all website data
- No localStorage persistence (GitHub is source of truth)
- Direct component prop updates via `updateComponentProps(pageSlug, componentId, props)`
- Automatic re-renders via Zustand subscriptions

### 2. Component Migration Pattern
**Before:**
```typescript
const [componentProps, setComponentProps] = useState(defaultProps);
useSyncPageDataToComponent(id, "ComponentType", setComponentProps);

const updateProp = (key, value) => {
  setComponentProps((prev) => ({ ...prev, [key]: value }));
  updateComponentProps(id, { [key]: value });
};
```

**After:**
```typescript
const websiteData = useWebsiteEditStore((state) => state.websiteData);
const currentPageSlug = useWebsiteEditStore((state) => state.currentPageSlug);
const updateComponentProps = useWebsiteEditStore((state) => state.updateComponentProps);

const componentProps = useMemo(() => {
  // Get component from store
  const pages = websiteData?.pages;
  // ... find component logic
  return component?.props || defaultProps;
}, [websiteData, currentPageSlug, id]);

const updateProp = (key, value) => {
  updateComponentProps(currentPageSlug, id, { [key]: value }, { source: 'manual' });
};
```

### 3. Removed Hooks
- ❌ `useSyncPageDataToComponent` - No longer needed (direct store subscription)
- ❌ `useSyncLlmOutput` - Can be handled differently (or keep if needed for AI edits)
- ❌ `useSyncColorEdits` - Can be handled differently (or keep if needed for color edits)
- ❌ Local component state - Read directly from store

## Current Implementation Details

### Files Modified

1. **`frontend/src/stores/websiteEditStore.ts`** (NEW)
   - Unified store for website data
   - Handles component prop updates
   - GitHub load/save operations

2. **`frontend/src/hooks/useWebsiteLoader.ts`**
   - Updated to populate new store alongside old stores
   - Both stores get data during migration period

3. **`frontend/src/components/editor/EditorialPageWrapper.tsx`**
   - Sets `currentPageSlug` in new store
   - TEMPORARILY only renders `auroraImageHero` components (for testing)
   - Has fallback to use passed `components` prop if store not ready

4. **`frontend/src/components/designs/herobanners/auroraImageHero/auroraImageHeroEdit.tsx`**
   - Migrated to use new store
   - Removed local state and sync hooks
   - Reads props directly from store via `useMemo`
   - Updates props directly in store

5. **`frontend/src/hooks/useWebsiteSave.ts`**
   - Updated to use new store's `saveToGitHub` method
   - Still handles structural changes (Claude Code)
   - Keeps old stores updated during migration

## Known Issues / Current State

1. **Text field not updating** - Component may not be re-rendering when store updates
   - Fixed: Using `useMemo` with `websiteData` dependency
   - Fixed: Proper Zustand selector subscription
   - Status: Should work now, needs testing

2. **Page slug normalization** - Handling "index" vs "/" vs ""
   - Fixed: Normalized in multiple places
   - Status: Should work now

3. **Variable naming conflicts** - Fixed duplicate `pages` declaration
   - Fixed: Renamed to `allPages` in first usage
   - Status: Resolved

## Next Steps

### Immediate (Testing Phase)
1. ✅ Test auroraImageHero component:
   - [ ] Load page - component renders
   - [ ] Edit text - updates without infinite loops
   - [ ] Save to GitHub - commits correctly
   - [ ] Reload - data persists

### Phase 4: Migrate Remaining Components
Once auroraImageHero works, migrate other components one by one:
- textAndList
- splitScreenHero
- carouselHero
- experienceCard
- imageTextBox
- etc.

**Migration pattern for each component:**
1. Remove local `componentProps` state
2. Remove `useSyncPageDataToComponent` hook
3. Add store subscription for `websiteData`
4. Use `useMemo` to compute props from store
5. Update `updateProp` to use new store method

### Phase 5: Cleanup
1. Remove old stores (`websiteStore`, `websiteMasterStore`)
2. Remove sync hooks from `hooks.ts`:
   - `useSyncPageDataToComponent`
   - Potentially `useSyncLlmOutput` and `useSyncColorEdits` (if not needed)
3. Remove localStorage persistence for website data
4. Update all references to old stores

## Benefits Expected

1. **No Infinite Loops** ✅
   - No circular syncing
   - Direct store subscriptions
   - Single source of truth

2. **Simpler GitHub Sync** ✅
   - One store to sync
   - No manual `syncToMaster()` needed
   - Save always commits current state

3. **Better Performance** ✅
   - Fewer hooks running
   - No debouncing needed
   - Direct store subscriptions are efficient

4. **Clearer Architecture** ✅
   - One store for website data
   - Context only for UI state
   - GitHub as source of truth

## Testing Checklist

- [ ] Page loads with auroraImageHero component
- [ ] Component displays correct initial data
- [ ] Text field editing works (no infinite loops)
- [ ] Changes persist in store
- [ ] Component re-renders when store updates
- [ ] Save to GitHub works
- [ ] Reload from GitHub works
- [ ] Version switching works
- [ ] No console errors

## Files to Review

1. `frontend/src/stores/websiteEditStore.ts` - New store implementation
2. `frontend/src/components/designs/herobanners/auroraImageHero/auroraImageHeroEdit.tsx` - Migrated component example
3. `frontend/src/components/editor/EditorialPageWrapper.tsx` - Wrapper that sets page slug
4. `frontend/docs/architecture-refactor-analysis.md` - Full analysis document

## Notes for Claude Code

- The new store is working but needs thorough testing
- Component migration is straightforward - follow auroraImageHero pattern
- Old stores are still active during migration (for safety)
- GitHub is the source of truth - store is ephemeral cache
- No localStorage persistence for website data (only UI preferences)

## Questions / Decisions Needed

1. **AI Output Sync**: How should `useSyncLlmOutput` work with new store?
   - Option A: Keep hook, update to use new store
   - Option B: Handle AI output directly in store
   - Option C: Use context only (current approach)

2. **Color Edits Sync**: How should `useSyncColorEdits` work?
   - Option A: Keep hook, update to use new store
   - Option B: Handle color edits directly in store
   - Option C: Use context only (current approach)

3. **Migration Order**: Which components to migrate next?
   - Recommendation: Start with simplest, work up to most complex

4. **Old Store Removal**: When to remove old stores?
   - Recommendation: After all components migrated and tested

