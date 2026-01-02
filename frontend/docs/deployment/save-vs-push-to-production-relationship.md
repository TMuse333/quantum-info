# Save Changes vs Push to Production: Relationship Analysis

## Current State

### Save Changes Flow
1. **Trigger**: User clicks "Save Current Changes" in editor sidebar
2. **Action**: Saves `websiteData.json` to **current branch** (experiment/development)
3. **API**: `/api/versions/create-github` (GitHub API)
4. **Result**: 
   - `websiteData.json` committed to editor branch
   - Store reloads from GitHub (source of truth)
   - Unsaved changes flag cleared

### Push to Production Flow
1. **Trigger**: User clicks "Deploy to Production" in deploy panel
2. **Data Source**: Uses `websiteData` from **store's current state** (`useWebsiteStore((state) => state.websiteData)`)
3. **Action**: 
   - Generates production files (page components, data files, routes)
   - Copies `.prod.tsx` component files
   - Pushes to **production branch**
4. **API**: `/api/production/deploy-stream` → `deployToProductionViaAPI` (GitHub API)
5. **Result**: Production branch updated with generated files

## The Problem: They Are NOT Linked

### Current Behavior
- **Push to Production** uses the store's current state, which may include **unsaved changes**
- If user has unsaved changes and pushes to production:
  - ✅ Production gets the latest changes (including unsaved ones)
  - ❌ Editor branch doesn't have those changes saved
  - ❌ If user reloads, they lose those changes
  - ❌ Version history mismatch (production ahead of editor branch)

### Example Scenario
1. User edits component text → unsaved change in store
2. User clicks "Deploy to Production" (without saving first)
3. Production gets deployed with the new text
4. User reloads page → loses the text edit (wasn't saved to editor branch)
5. Production has text that doesn't exist in editor branch

## Should They Be Linked?

### Option 1: Auto-Save Before Push (RECOMMENDED)
**Behavior**: Automatically save changes to editor branch before pushing to production

**Pros**:
- Ensures editor branch and production are in sync
- No data loss on reload
- Clean version history

**Cons**:
- Creates a commit even if user didn't want to save yet
- Might create "empty" commits if no actual changes

**Implementation**:
```typescript
// In deployPanel.tsx or AnimatedDeployModal.tsx
const handleDeploy = async (dryRun: boolean) => {
  const store = useWebsiteStore.getState();
  
  // Check for unsaved changes
  if (store.hasUnsavedChanges) {
    // Auto-save first
    await store.saveToGitHub(
      branch,
      'Auto-save before production deployment'
    );
  }
  
  // Then proceed with deployment
  // ...
};
```

### Option 2: Warn User (CURRENT - No Auto-Save)
**Behavior**: Show warning if unsaved changes exist, but allow deployment

**Pros**:
- User has control
- No unexpected commits

**Cons**:
- User can still push unsaved changes
- Risk of data loss

**Implementation**:
```typescript
if (store.hasUnsavedChanges) {
  const proceed = confirm(
    'You have unsaved changes. Production will include these changes, ' +
    'but they won\'t be saved to the editor branch. Continue?'
  );
  if (!proceed) return;
}
```

### Option 3: Block Deployment (STRICT)
**Behavior**: Prevent deployment if unsaved changes exist

**Pros**:
- Forces user to save first
- No risk of data loss
- Clean workflow

**Cons**:
- Extra step for user
- Might be annoying if user wants to test deployment

**Implementation**:
```typescript
if (store.hasUnsavedChanges) {
  alert('Please save your changes before deploying to production.');
  return;
}
```

## Recommendation

**Use Option 1 (Auto-Save)** because:
1. Production should always reflect what's in the editor branch
2. Prevents data loss
3. Cleaner version history
4. User can still manually save if they want a specific commit message

## Current Code Locations

### Save Changes
- **Hook**: `frontend/src/hooks/useWebsiteSave.ts`
- **Store Method**: `frontend/src/stores/slices/websiteDataSlice.ts::saveToGitHub()`
- **API**: `frontend/src/app/api/versions/create-github/route.ts`
- **UI**: `frontend/src/components/editor/versionControl/versionControlPanel.tsx`

### Push to Production
- **Component**: `frontend/src/components/editor/dashboard/deployPanel.tsx`
- **Modal**: `frontend/src/components/deployment/AnimatedDeployModal.tsx`
- **API**: `frontend/src/app/api/production/deploy-stream/route.ts`
- **Deploy Function**: `frontend/src/lib/deploy/github-api-operations.ts::deployToProductionViaAPI()`

## Data Flow Comparison

### Save Changes
```
Store (current state)
  ↓
/api/versions/create-github
  ↓
GitHub API (commit websiteData.json)
  ↓
Editor Branch (experiment/development)
  ↓
Store reloads from GitHub
```

### Push to Production
```
Store (current state - may have unsaved changes)
  ↓
/api/production/deploy-stream
  ↓
Generate production files
  ↓
GitHub API (commit production files)
  ↓
Production Branch
```

## Summary

- **Currently**: Not linked - push can include unsaved changes
- **Recommendation**: Auto-save before push (Option 1)
- **Impact**: Prevents data loss and version mismatch
- **Implementation**: Add auto-save check in deploy flow

