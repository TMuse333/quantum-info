# GitHub Sync Issue: Theme Not Persisting After Save

## Problem Summary

When a user saves a color theme (e.g., dark red) to GitHub and refreshes the page, the theme reverts to the default version instead of loading the saved theme from GitHub.

## Symptoms

1. User creates/saves a theme in the General Overview panel
2. Theme is saved to GitHub via the "Save Current Changes" button
3. Page is refreshed
4. Theme reverts to default (no `colorTheme` in store)
5. Components show `undefined` for all color properties (`mainColor`, `textColor`, `baseBgColor`, `bgLayout`)

## Current Behavior

### What Works
- ✅ Theme can be created and saved locally in Zustand store
- ✅ Theme changes are tracked in edit history
- ✅ Save button commits to GitHub successfully
- ✅ Store auto-detects repository from git remote

### What Doesn't Work
- ❌ Theme doesn't persist after page refresh
- ❌ GitHub API returns data but `colorTheme` is `undefined`
- ❌ Components load with no colors (all `undefined`)
- ❌ Store shows `colorTheme: undefined` even after GitHub fetch

## Root Cause Analysis

### Hypothesis 1: Data Not Saved to GitHub
- **Status**: Unknown - Need to verify what's actually in GitHub
- **Check**: Look at the actual `websiteData.json` file in GitHub commit

### Hypothesis 2: Data Structure Mismatch
- **Status**: Likely - `websiteData.json` structure vs `WebsiteMaster` structure
- **Issue**: When saving, we save full `WebsiteMaster` object, but when loading, we might be getting just the `pages` structure
- **Evidence**: Local `websiteData.json` only has `pages`, no `colorTheme` field

### Hypothesis 3: API Route Not Loading Full Structure
- **Status**: Possible - API routes might be returning partial data
- **Check**: Server logs show what GitHub actually returns

### Hypothesis 4: Store Not Properly Transforming Data
- **Status**: Possible - Transformation might be losing `colorTheme`
- **Evidence**: Store logs show `colorTheme: undefined` after fetch

## What Was Tried

### 1. Added Comprehensive Logging
**Files Modified:**
- `frontend/src/app/api/versions/get-latest/route.ts`
- `frontend/src/app/api/versions/switch-github/route.ts`
- `frontend/src/hooks/useWebsiteLoader.ts`
- `frontend/src/stores/websiteMasterStore.ts`
- `frontend/src/stores/websiteStore.ts`
- `frontend/src/components/editor/dashboard/generalOverviewPanel.tsx`

**What It Does:**
- Logs what GitHub API returns (server-side)
- Logs what store receives (client-side)
- Logs transformation steps
- Logs component colors

**Result**: Shows `colorTheme: undefined` in all logs

### 2. Fixed Store Initialization
**Files Modified:**
- `frontend/src/stores/websiteMasterStore.ts`
- `frontend/src/components/editor/EditorialPageWrapper.tsx`

**What It Does:**
- Store now auto-fetches from GitHub on initialization
- Auto-detects repo from git remote if not in URL params
- Transforms loaded data to proper `WebsiteMaster` structure

**Result**: Store fetches from GitHub, but `colorTheme` still `undefined`

### 3. Removed localStorage Caching
**Files Modified:**
- `frontend/src/hooks/useWebsiteLoader.ts`

**What It Does:**
- Removed localStorage fallback that was using stale data
- Always fetches fresh from GitHub
- Uses sessionStorage to prevent duplicate fetches in same session

**Result**: Fresh data is fetched, but still missing `colorTheme`

### 4. Added Data Transformation
**Files Modified:**
- `frontend/src/hooks/useWebsiteLoader.ts`
- `frontend/src/stores/websiteMasterStore.ts`

**What It Does:**
- Transforms loaded data to ensure proper `WebsiteMaster` structure
- Adds default values for missing fields
- Preserves `colorTheme` if it exists

**Result**: Transformation works, but `colorTheme` isn't in source data

### 5. Added Fallback for 404 Errors
**Files Modified:**
- `frontend/src/stores/websiteMasterStore.ts`

**What It Does:**
- If `switch-github` returns 404, falls back to `get-latest`
- Better error logging

**Result**: Handles routing issues, but doesn't fix missing data

## Files Involved

### Core Store Files
1. **`frontend/src/stores/websiteMasterStore.ts`**
   - Main Zustand store for website data
   - Contains `initializeFromGitHub()` method
   - Handles `setMaster()` and `updateMaster()`
   - **Key Issue**: Receives data but `colorTheme` is `undefined`

2. **`frontend/src/stores/websiteStore.ts`**
   - Component-level store
   - Manages component props and colors
   - **Key Issue**: Components have `undefined` colors

3. **`frontend/src/stores/editHistoryStore.ts`**
   - Tracks all edits including theme changes
   - Not directly related to sync issue

### API Routes
4. **`frontend/src/app/api/versions/get-latest/route.ts`**
   - Fetches latest commit from GitHub
   - Returns `websiteData.json` content
   - **Key Issue**: Need to verify what's actually in the file

5. **`frontend/src/app/api/versions/switch-github/route.ts`**
   - Fetches specific version/commit from GitHub
   - Returns `websiteData.json` content
   - **Key Issue**: Returns 404 sometimes, has fallback

6. **`frontend/src/app/api/versions/create-github/route.ts`**
   - Commits changes to GitHub
   - Saves `websiteData.json` file
   - **Key Issue**: Need to verify what's actually being saved

7. **`frontend/src/app/api/git/repo-info/route.ts`**
   - Auto-detects repository info
   - Works correctly

### Hooks
8. **`frontend/src/hooks/useWebsiteLoader.ts`**
   - Loads website data on page load
   - Fetches from GitHub or uses local fallback
   - **Key Issue**: Transformation might be losing data

9. **`frontend/src/hooks/useWebsiteSave.ts`**
   - Handles saving to GitHub
   - Commits `websiteData.json` with full `WebsiteMaster` object
   - **Key Issue**: Need to verify what's actually in the commit

### Components
10. **`frontend/src/components/editor/dashboard/generalOverviewPanel.tsx`**
    - Theme editor UI
    - Saves theme to `websiteMaster.colorTheme`
    - **Key Issue**: Theme saves locally but doesn't persist

11. **`frontend/src/components/editor/EditorialPageWrapper.tsx`**
    - Wrapper that initializes stores
    - Calls `initializeFromGitHub()` on mount
    - **Key Issue**: Initialization happens but data is incomplete

### Data Files
12. **`frontend/src/data/websiteData.json`**
    - Local fallback data
    - Only contains `pages` structure, no `colorTheme`
    - **Key Issue**: This is the structure GitHub might be returning

### Type Definitions
13. **`frontend/src/types/website.ts`**
    - Defines `WebsiteMaster` interface
    - Includes `colorTheme?: {...}` field
    - **Key Issue**: Type exists but data doesn't match

## Debugging Steps Needed

### Step 1: Verify What's in GitHub
**Action**: Check the actual `websiteData.json` file in the GitHub commit
**Command**: 
```bash
# View the file in the latest commit
git show HEAD:frontend/src/data/websiteData.json
# Or check a specific commit
git show <commit-sha>:frontend/src/data/websiteData.json
```

**Expected**: Should see `colorTheme` field in the JSON
**If Missing**: The save process isn't including `colorTheme`

### Step 2: Check Server Logs
**Action**: Look at server terminal when page loads
**Look For**: 
- `🔵 [GitHub API] get-latest - Raw websiteData from GitHub:`
- `🔵 [GitHub API] get-latest - colorTheme:`

**Expected**: Should see `colorTheme` in the raw data
**If Missing**: GitHub file doesn't have it, or API isn't returning it

### Step 3: Check Save Process
**Action**: Add logging to `useWebsiteSave.ts` before commit
**Look For**: What `latestWebsiteMaster` contains before saving

**Expected**: Should include `colorTheme` field
**If Missing**: Theme isn't being added to `websiteMaster` before save

### Step 4: Verify File Path
**Action**: Check what path is used when saving vs loading
**Files to Check**:
- `useWebsiteSave.ts` - saves to `src/data/websiteData.json`
- `get-latest/route.ts` - looks for `src/data/websiteData.json` or `frontend/src/data/websiteData.json`

**Expected**: Paths should match
**If Mismatch**: File might be saved to wrong location

## Most Likely Issues

### Issue #1: Save Path Mismatch
**Problem**: Saving to `src/data/websiteData.json` but loading from `frontend/src/data/websiteData.json`
**Fix**: Ensure save and load use same path

### Issue #2: Data Structure on Save
**Problem**: `JSON.stringify(latestWebsiteMaster)` might not include all fields
**Fix**: Verify what's actually in the stringified object before commit

### Issue #3: GitHub File Structure
**Problem**: GitHub file might only have `pages` structure (like local fallback)
**Fix**: Ensure full `WebsiteMaster` object is saved, not just `pages`

## Next Steps

1. **Verify GitHub File Content**: Check what's actually in the committed file
2. **Add Pre-Save Logging**: Log `latestWebsiteMaster` before stringifying
3. **Check File Paths**: Ensure save and load paths match
4. **Verify JSON Structure**: Ensure full object is being saved, not just pages
5. **Test Save Process**: Manually inspect the commit to see what was saved

## Questions for Claude

1. Why is `colorTheme` not persisting in GitHub even though it's saved to the store?
2. Is the `JSON.stringify(latestWebsiteMaster)` in `useWebsiteSave.ts` including all fields?
3. Are the file paths for save and load matching correctly?
4. Should we be saving to a different file or structure?
5. Is there a serialization issue with the `WebsiteMaster` object?

