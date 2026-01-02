# Architecture Refactor Analysis: State Management & GitHub Sync

## Executive Summary

This document analyzes the current architecture to identify root causes of infinite loops, GitHub sync issues, and state management confusion. It provides recommendations for a refactor that simplifies the system, makes GitHub the dominant source of truth, and minimizes changes to editorial components.

## Current Architecture Overview

### State Management Layers

1. **Context (`context.tsx`)** - UI state for editor
   - `currentComponent` - Selected component in sidebar
   - `currentColorEdits` - Temporary color edits
   - `LlmCurrentTextOutput` - AI-generated text output
   - `assistantMessage` - Chatbot messages
   - `previewStructuralChanges` - Claude Code previews

2. **WebsiteStore (`websiteStore.ts`)** - Current page editing state
   - `currentPageData` - Current page being edited
   - `components` - Component instances array
   - `updateComponentProps()` - Updates component props
   - **Persisted to localStorage** for offline editing

3. **WebsiteMasterStore (`websiteMasterStore.ts`)** - Full website state
   - `websiteMaster` - Complete website data (all pages, theme, SEO)
   - `setMaster()` - Sets entire website state
   - `refreshFromGitHub()` - Loads from GitHub
   - **Not persisted** - Always loads from GitHub on mount

4. **GitHub (`websiteData.json`)** - Source of truth
   - Stored in repo at `frontend/src/data/websiteData.json`
   - Committed via `/api/versions/create-github`
   - Loaded via `/api/versions/get-latest` or `/api/versions/switch-github`

### Data Flow (Current)

```
GitHub (websiteData.json)
    ↓
useWebsiteLoader / websiteMasterStore.initializeFromGitHub()
    ↓
websiteMasterStore.websiteMaster
    ↓
EditorialPageWrapper (syncs page to websiteStore)
    ↓
websiteStore.currentPageData
    ↓
Component Edit Files (useSyncPageDataToComponent)
    ↓
Local component state (componentProps)
    ↓
User edits → updateProp() → updateComponentProps()
    ↓
websiteStore.currentPageData (updated)
    ↓
useSyncPageDataToComponent (watches currentPageData)
    ↓
[INFINITE LOOP POTENTIAL]
```

## Root Causes of Issues

### 1. Infinite Loop Issues

**Problem:** Maximum update depth exceeded when editing text or clicking components.

**Root Causes:**

#### A. Circular Update Chain
```
User types → updateProp() 
  → updateComponentProps() 
  → websiteStore.currentPageData changes
  → useSyncPageDataToComponent detects change
  → setComponentProps() called
  → Component re-renders
  → Potentially triggers updateProp() again
```

#### B. Multiple Sync Hooks Competing
Three hooks all sync props to component state:
- `useSyncPageDataToComponent` - Syncs from store to component
- `useSyncLlmOutput` - Syncs AI output to component  
- `useSyncColorEdits` - Syncs color edits to component

These can interfere with each other, especially when:
- AI output arrives while user is typing
- Color edits happen while props are syncing
- Store updates trigger while component is updating

#### C. Object Reference Changes
Even when props haven't changed, if `currentPageData` gets a new object reference, `useSyncPageDataToComponent` triggers. This happens because:
- `updateComponentProps` creates new objects: `{ ...comp, props: { ...comp.props, ...props } }`
- Zustand's `set()` creates new state objects
- `useSyncPageDataToComponent` depends on `currentPageData` object reference

#### D. EditorialPageWrapper Double Sync
`EditorialPageWrapper` syncs from `websiteMaster` to `websiteStore`:
```typescript
setCurrentPageData(page); // Sets websiteStore
setMaster({ ...currentMaster, pages: updatedPages }); // Updates websiteMaster
```

This can create a loop:
1. User edits → `websiteStore` updates
2. `EditorialPageWrapper` effect runs → updates `websiteMaster`
3. `websiteMaster` change might trigger reload → updates `websiteStore` again

### 2. GitHub Sync Issues

**Problems:**
- Changes don't always sync to GitHub correctly
- Manual `syncToMaster()` required before saving
- Confusion about which store has the "real" data
- Version switching doesn't always reload correctly

**Root Causes:**

#### A. Dual Store System
- Edits happen in `websiteStore` (for current page)
- GitHub sync happens from `websiteMasterStore` (full website)
- Manual sync required: `websiteStore.syncToMaster()` before saving
- Easy to forget sync, leading to lost edits

#### B. Inconsistent Data Flow
- Load: GitHub → `websiteMasterStore` → `websiteStore`
- Edit: `websiteStore` → (manual sync) → `websiteMasterStore` → GitHub
- The manual sync step is error-prone

#### C. Persistence Confusion
- `websiteStore` is persisted to localStorage
- `websiteMasterStore` is not persisted
- On reload, `websiteStore` might have stale data from localStorage
- `websiteMasterStore` loads fresh from GitHub
- These can conflict

#### D. Version Switching Complexity
- Version switch updates `websiteMasterStore`
- But `websiteStore` might still have old data
- `EditorialPageWrapper` needs to detect and sync
- Timing issues can cause stale data to persist

### 3. State Management Confusion

**Problems:**
- Some edits use `context.tsx` (colors, AI output)
- Others use `websiteStore` (text, images)
- Unclear which to use for new features
- Duplicate state in multiple places

**Examples:**
- **Colors:** Set in `context.currentColorEdits`, synced via `useSyncColorEdits`, but also stored in component props
- **AI Text:** Set in `context.LlmCurrentTextOutput`, synced via `useSyncLlmOutput`, but also in component props
- **Manual Edits:** Directly in `websiteStore` via `updateComponentProps`

## Proposed Refactor: GitHub-Dominant Architecture

### Core Principles

1. **GitHub is the Single Source of Truth**
   - `websiteData.json` in GitHub is authoritative
   - All state derives from GitHub
   - No localStorage persistence of website data
   - Only UI preferences (editor mode, sidebar state) in localStorage

2. **Single Store for Website Data**
   - Merge `websiteStore` and `websiteMasterStore` into one store
   - Rename to `editStore` or `websiteEditStore`
   - Store full website data, not just current page
   - Current page is just a view/selector, not separate state

3. **Unidirectional Data Flow**
   ```
   GitHub → Store → Components
   Components → Store → GitHub (on save)
   ```
   - No circular syncing
   - No automatic bidirectional sync
   - Explicit save action commits to GitHub

4. **Minimize Editorial Component Changes**
   - Keep component edit files mostly unchanged
   - Only change how they read/write data
   - Keep hooks like `useSyncPageDataToComponent` but simplify them

### Proposed Architecture

#### New Store Structure

```typescript
interface WebsiteEditStore {
  // Full website data (from GitHub)
  websiteData: WebsiteMaster | null;
  
  // Current page selector (just a slug, not separate state)
  currentPageSlug: string;
  
  // UI state (editor mode, selected component, etc.)
  editorMode: boolean;
  selectedComponentId: string | null;
  
  // Actions
  loadFromGitHub: (repoOwner, repoName, branch, version?) => Promise<void>;
  updateComponentProps: (pageSlug, componentId, props) => void;
  saveToGitHub: (commitMessage) => Promise<void>;
  
  // Computed getters
  getCurrentPage: () => WebsitePage | null;
  getComponent: (pageSlug, componentId) => ComponentInstance | null;
}
```

#### Data Flow (Proposed)

```
GitHub (websiteData.json)
    ↓
loadFromGitHub() on mount
    ↓
websiteEditStore.websiteData
    ↓
Component reads: getCurrentPage() or getComponent()
    ↓
User edits → updateComponentProps()
    ↓
websiteEditStore.websiteData (updated in memory)
    ↓
Component re-renders (via Zustand subscription)
    ↓
[NO SYNC HOOKS NEEDED - Direct store subscription]
    ↓
User clicks Save → saveToGitHub()
    ↓
GitHub (websiteData.json updated)
    ↓
Reload from GitHub
```

#### Benefits

1. **No Infinite Loops**
   - Single source of truth (store)
   - No circular syncing
   - Components subscribe directly to store
   - No `useSyncPageDataToComponent` needed

2. **Simpler GitHub Sync**
   - One store to sync
   - No manual `syncToMaster()` needed
   - Save always commits current store state
   - Load always replaces store state

3. **Clearer State Management**
   - One store for website data
   - Context only for UI state (sidebar, modals)
   - No confusion about where to put data

4. **Better Performance**
   - Fewer hooks running
   - No debouncing needed
   - Direct store subscriptions are efficient

### Implementation Plan

#### Phase 1: Create New Store (No Breaking Changes)

1. Create `websiteEditStore.ts` alongside existing stores
2. Implement new store with full website data
3. Add migration logic to copy from old stores
4. Test in parallel with old stores

#### Phase 2: Update Data Loading

1. Update `useWebsiteLoader` to populate new store
2. Remove `websiteMasterStore` initialization
3. Update `EditorialPageWrapper` to use new store
4. Test loading and version switching

#### Phase 3: Update Component Edits (Minimal Changes)

**For each editorial component:**

**Before:**
```typescript
const currentPageData = useWebsiteStore((state) => state.currentPageData);
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

// Get component from store directly
const component = websiteData?.pages?.[currentPageSlug]?.components?.find(c => c.id === id);
const componentProps = component?.props || defaultProps;

// Update directly in store
const updateProp = (key, value) => {
  updateComponentProps(currentPageSlug, id, { [key]: value });
};
```

**Key Changes:**
- Remove `useSyncPageDataToComponent` hook
- Remove local `componentProps` state (use store directly)
- `updateProp` only calls store, no local state
- Component re-renders via Zustand subscription

#### Phase 4: Update Save Flow

1. Update `useWebsiteSave` to use new store
2. Remove `syncToMaster()` call
3. Save directly from `websiteEditStore.websiteData`
4. Test save and reload

#### Phase 5: Cleanup

1. Remove old stores (`websiteStore`, `websiteMasterStore`)
2. Remove sync hooks (`useSyncPageDataToComponent`)
3. Update all references
4. Remove localStorage persistence for website data

### Source of Truth Decision

**Recommendation: GitHub (`websiteData.json`) is the source of truth**

**Rationale:**
- GitHub provides version history
- Multiple users can collaborate
- Can recover from any state
- Clear audit trail
- Works offline (with local edits, sync on save)

**Store Role:**
- Store is a **cache** of GitHub data
- Store is **ephemeral** (not persisted)
- On load: GitHub → Store (replace)
- On save: Store → GitHub (commit)
- On error: Reload from GitHub

**Alternative Considered: Store as Source of Truth**
- ❌ No version history
- ❌ Hard to collaborate
- ❌ Can't recover from bad state
- ❌ localStorage can get corrupted
- ✅ Faster (no GitHub calls)
- ✅ Works offline better

**Decision: GitHub wins** because version control and collaboration are more valuable than pure speed.

### Impact on Editorial Components

#### Minimal Changes Required

**What Stays the Same:**
- Component structure and props
- Editable fields and UI
- Color derivation and styling
- Image handling
- All visual/UX code

**What Changes:**
- How component reads its props (from store, not local state)
- How component updates props (direct store call, not local state + sync)
- Remove `useSyncPageDataToComponent` hook
- Remove local `componentProps` state

**Example Refactor:**

**Before (textAndListEdit.tsx):**
```typescript
const [componentProps, setComponentProps] = useState<Partial<TextAndListProps>>({});
useSyncPageDataToComponent(id, "TextAndList", setComponentProps);

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

// Get props directly from store
const component = websiteData?.pages?.[currentPageSlug]?.components?.find(c => c.id === id);
const componentProps = { ...defaultTextAndListProps, ...component?.props };

// Update directly
const updateProp = (key, value) => {
  updateComponentProps(currentPageSlug, id, { [key]: value });
};
```

**Lines Changed:** ~5-10 lines per component (mostly removing hooks and local state)

### Context Usage (Keep as Is)

**Keep in Context:**
- `currentComponent` - Selected component in sidebar (UI state)
- `currentColorEdits` - Temporary color edits before applying (UI state)
- `LlmCurrentTextOutput` - AI output before applying (UI state)
- `assistantMessage` - Chatbot messages (UI state)
- `previewStructuralChanges` - Claude Code previews (UI state)
- `editorMode` - Editor toggle (UI state)

**Move to Store:**
- Nothing - context is fine for UI state

**Rationale:** Context is appropriate for transient UI state that doesn't need to persist or sync to GitHub.

### Migration Strategy

#### Option A: Big Bang (Recommended if Time Permits)
1. Build new store completely
2. Update all components at once
3. Remove old stores
4. Test everything
5. Deploy

**Pros:** Clean break, no intermediate state
**Cons:** Large change, higher risk

#### Option B: Gradual Migration (Recommended for Safety)
1. Build new store
2. Migrate one component at a time
3. Keep old stores until all migrated
4. Remove old stores when done

**Pros:** Lower risk, can test incrementally
**Cons:** Temporary complexity during migration

#### Option C: Parallel Run (Safest)
1. Build new store
2. Run both systems in parallel
3. Feature flag to switch between
4. Migrate gradually
5. Remove old when confident

**Pros:** Safest, can rollback easily
**Cons:** Most complex, temporary duplication

### Risks & Mitigations

#### Risk 1: Breaking Existing Functionality
**Mitigation:**
- Comprehensive testing before migration
- Gradual migration (Option B or C)
- Keep old code until new code proven
- Feature flags for rollback

#### Risk 2: Performance Issues
**Mitigation:**
- Zustand subscriptions are efficient
- No unnecessary re-renders (selectors)
- Test with large websites
- Profile and optimize if needed

#### Risk 3: Lost Edits During Migration
**Mitigation:**
- Save all changes before migration
- Test save/load cycle thoroughly
- Have rollback plan
- Backup localStorage before clearing

#### Risk 4: Editorial Components Break
**Mitigation:**
- Minimal changes to components
- Test each component after migration
- Keep old code as reference
- Can revert component-by-component

### Success Criteria

1. ✅ No infinite loops when editing text
2. ✅ No infinite loops when clicking components
3. ✅ GitHub sync works reliably
4. ✅ Version switching works correctly
5. ✅ All edits save to GitHub
6. ✅ No lost edits
7. ✅ Editorial components work as before
8. ✅ Performance is same or better
9. ✅ Code is simpler and easier to understand

### Timeline Estimate

- **Analysis & Design:** 1 day (this document)
- **New Store Implementation:** 2-3 days
- **Update Data Loading:** 1 day
- **Migrate Components (10-15 components):** 3-5 days
- **Update Save Flow:** 1 day
- **Testing & Bug Fixes:** 2-3 days
- **Cleanup:** 1 day

**Total: 11-16 days** (assuming gradual migration)

### Recommendations

1. **Proceed with Refactor** - The current architecture has fundamental issues that will only get worse as the codebase grows.

2. **Use Gradual Migration (Option B)** - Balance between safety and speed.

3. **GitHub as Source of Truth** - Provides version control, collaboration, and recovery.

4. **Single Store** - Simplifies everything and eliminates sync issues.

5. **Minimize Component Changes** - Only change data access, keep everything else.

6. **Keep Context for UI State** - It's appropriate for transient UI state.

7. **Test Thoroughly** - Especially save/load cycles and version switching.

### Questions to Resolve

1. **Store Name:** `editStore`, `websiteEditStore`, or `websiteStore` (reuse name)?
   - **Recommendation:** `websiteEditStore` - clear and distinct

2. **Persistence:** Should we persist anything to localStorage?
   - **Recommendation:** Only UI preferences (editor mode, sidebar state), not website data

3. **Context Cleanup:** Should we move any context state to store?
   - **Recommendation:** No - context is fine for UI state

4. **Migration Timeline:** How urgent is this?
   - **Recommendation:** High priority - infinite loops are blocking

5. **Component Migration Order:** Which components first?
   - **Recommendation:** Start with simplest (auroraImageHero), then most complex (textAndList)

## Conclusion

The current architecture has fundamental issues with circular dependencies, dual stores, and unclear data flow. A refactor to a GitHub-dominant, single-store architecture will:

- Eliminate infinite loops
- Simplify GitHub sync
- Clarify state management
- Minimize changes to editorial components
- Improve maintainability

The refactor is **necessary and worthwhile**, with manageable risk if done gradually.

