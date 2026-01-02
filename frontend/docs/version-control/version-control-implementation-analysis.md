# Version Control Migration - GitHub as Source of Truth

## Overview

This document outlines the migration to **GitHub-first version control**, where:
- **GitHub commits** = Primary source of truth
- **websiteData.json** = Stored in git, versioned via commits
- **MongoDB** = Secondary/optional (for metadata or fallback)
- **Save Changes** = Creates new git commit
- **Version Tab** = Shows git commit history

## Branch Strategy Context

This template repo uses a **three-branch strategy**:
- **`experiment`** - Testing and development (all components)
- **`development`** - What clients download (editorial + empty designs)
- **`production`** - Client production code (no editorial)

**Version control works on the `development` branch** - this is where clients make edits and commits are created. See `branch-strategy.md` for details.

## Core Philosophy

**GitHub is the source of truth** - every save creates a commit, every version is a commit, and the version control panel shows git history.

## Current State Analysis

### What Exists in Template Repo

✅ **Version Control Panel** (`versionControlPanel.tsx`)
- Currently fetches from MongoDB
- Needs to switch to GitHub commits

✅ **Save Hook** (`useWebsiteSave.ts`)
- Currently saves to MongoDB first
- Needs to commit to GitHub first, MongoDB second

✅ **Loader Hook** (`useWebsiteLoader.ts`)
- Currently loads from MongoDB or localStorage
- Needs to load from GitHub commits

❌ **Missing**
- GitHub commit creation on save
- GitHub commit fetching for versions
- Loading websiteData.json from specific commits

## Implementation Strategy: GitHub-First Approach

### Core Workflow

1. **User makes edits** → Changes in editor
2. **User clicks "Save Changes"** → 
   - Commit `websiteData.json` to GitHub (development branch)
   - Commit message = user's description
   - MongoDB update is secondary (optional)
3. **User opens Version Tab** →
   - Fetch commits from GitHub
   - Display as versions
   - Each commit = one version
4. **User clicks a version** →
   - Load `websiteData.json` from that commit
   - Display in editor (read-only or editable)

### Key Changes

1. **Save = Git Commit** (not MongoDB save)
2. **Versions = Git Commits** (not MongoDB documents)
3. **websiteData.json in Git** (source of truth)
4. **MongoDB Optional** (metadata only, if needed)

## Implementation Plan: GitHub-First

### Phase 1: Update Save Hook - Commit to GitHub First

**File:** `src/hooks/useWebsiteSave.ts`

**New Flow:**
1. User clicks "Save Changes"
2. **PRIMARY:** Commit `websiteData.json` to GitHub (development branch)
3. **SECONDARY:** Update MongoDB (optional, for metadata)
4. Show success message

**Implementation:**
```typescript
const handleConfirmSave = async (commitMessage: string) => {
  const websiteId = searchParams.get("id");
  if (!websiteId) {
    alert("Cannot save: No website ID found.");
    return;
  }

  setIsSaving(true);
  
  try {
    // Get latest websiteMaster
    const latestWebsiteMaster = useWebsiteMasterStore.getState().websiteMaster;
    
    // STEP 1: Commit to GitHub (PRIMARY - this is the source of truth)
    console.log(`💾 [useWebsiteSave] Committing to GitHub...`);
    const githubResponse = await fetch('/api/versions/create-github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId,
        commitMessage,
        files: [{
          path: 'src/data/websiteData.json',
          content: JSON.stringify(latestWebsiteMaster, null, 2),
          encoding: 'utf-8',
        }],
      }),
    });

    if (!githubResponse.ok) {
      throw new Error('Failed to commit to GitHub');
    }

    const githubData = await githubResponse.json();
    console.log(`✅ [useWebsiteSave] Committed to GitHub: ${githubData.commitSha}`);
    
    // STEP 2: Update MongoDB (SECONDARY - optional metadata)
    try {
      const { _id, createdAt, updatedAt, owner, ownerId, ...updateData } = latestWebsiteMaster;
      await fetch('/api/userActions/update-website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          updates: updateData,
        }),
      });
      console.log(`✅ [useWebsiteSave] MongoDB updated (secondary)`);
    } catch (mongoError) {
      console.warn('⚠️ MongoDB update failed, but GitHub commit succeeded');
      // Don't fail - GitHub is source of truth
    }
    
    // Reload from GitHub to get latest commit
    localStorage.removeItem("website-master-store");
    const reloadResponse = await fetch(`/api/versions/switch-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId,
        commitSha: githubData.commitSha,
      }),
    });
    
    if (reloadResponse.ok) {
      const reloadData = await reloadResponse.json();
      setMaster(reloadData.websiteData);
      setOriginalWebsiteMaster(reloadData.websiteData);
    }
    
    setSaveSuccess(true);
    setShowCommitModal(false);
    window.dispatchEvent(new CustomEvent('versionCreated'));
    
  } catch (error) {
    console.error('❌ [useWebsiteSave] Error:', error);
    alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    setShowCommitModal(false);
  } finally {
    setIsSaving(false);
  }
};
```

### Phase 2: Update Version Control Panel - Show Git Commits

**File:** `src/components/editor/versionControl/versionControlPanel.tsx`

**New Flow:**
1. Fetch commits from GitHub (development branch)
2. Display commits as versions
3. Each commit shows: SHA, message, date, author
4. Click version → Load websiteData.json from that commit

**Implementation:**
```typescript
const fetchVersions = async () => {
  if (!websiteId) return;
  
  setLoading(true);
  try {
    // Fetch commits from GitHub (PRIMARY source)
    const response = await fetch(`/api/versions/list-github?websiteId=${websiteId}`);
    if (response.ok) {
      const data = await response.json();
      // Transform GitHub commits to version format
      setVersions(data.versions || []);
    } else {
      throw new Error('Failed to fetch versions from GitHub');
    }
  } catch (error) {
    console.error("Error fetching versions from GitHub:", error);
    // No fallback - GitHub is required
    alert("Failed to load version history. Please check your repository connection.");
  } finally {
    setLoading(false);
  }
};

const handleSwitchVersion = async (versionNumber: number) => {
  if (!websiteId) return;
  
  const version = versions.find(v => v.versionNumber === versionNumber);
  if (!version || !version.commitSha) return;
  
  setSwitchingVersion(versionNumber);
  
  try {
    // Load websiteData.json from specific commit
    const response = await fetch(`/api/versions/switch-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId,
        commitSha: version.commitSha,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const websiteData = data.websiteData;
      
      // Update store with version data
      setMaster(websiteData);
      
      // Navigate to editor with version param
      router.push(`/editor?id=${websiteId}&version=${versionNumber}`);
    } else {
      throw new Error("Failed to load version");
    }
  } catch (error) {
    console.error("Error switching version:", error);
    alert("Failed to load version");
    setSwitchingVersion(null);
  }
};
```

### Phase 3: Update Loader Hook - Load from GitHub Commits

**File:** `src/hooks/useWebsiteLoader.ts`

**New Flow:**
1. Check if viewing a version (version param in URL)
2. If version → Load from GitHub commit
3. If current → Load from latest commit (or MongoDB as fallback)
4. websiteData.json comes from git, not MongoDB

**Implementation:**
```typescript
// In useWebsiteLoader
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!isHydrated) return;

  const websiteId = searchParams.get("id");
  const versionNumber = searchParams.get("version");

  if (websiteId) {
    if (versionNumber) {
      // Load from specific GitHub commit
      const fetchFromCommit = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/versions/switch-github`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              websiteId,
              versionNumber: parseInt(versionNumber),
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const website: WebsiteMaster = data.websiteData;
            setMaster(website);
            setOriginalWebsiteMaster(JSON.parse(JSON.stringify(website)));
          }
        } catch (error) {
          setError("Failed to load version");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchFromCommit();
    } else {
      // Load latest from GitHub (or MongoDB fallback)
      const fetchLatest = async () => {
        try {
          setIsLoading(true);
          // Try GitHub first
          const githubResponse = await fetch(`/api/versions/get-latest?websiteId=${websiteId}`);
          if (githubResponse.ok) {
            const data = await githubResponse.json();
            setMaster(data.websiteData);
          } else {
            // Fallback to MongoDB
            const mongoResponse = await fetch(`/api/userActions/get-website?id=${websiteId}`);
            if (mongoResponse.ok) {
              const mongoData = await mongoResponse.json();
              setMaster(mongoData.website);
            }
          }
        } catch (error) {
          setError("Failed to load website");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchLatest();
    }
  }
}, [isHydrated, searchParams, setMaster]);
```

### Phase 4: Easy-Money App - GitHub API Routes (Not This Repo)

#### 4.1 Create GitHub API Routes

**New Files Needed in Easy-Money App:**

**`frontend/src/app/api/versions/list-github/route.ts`**
- Fetch commits from GitHub (development branch)
- Transform to version format
- Return versions array with commit SHA, message, date

**`frontend/src/app/api/versions/switch-github/route.ts`**
- Get websiteData.json from specific commit SHA
- Decode base64 content
- Return websiteData object

**`frontend/src/app/api/versions/create-github/route.ts`**
- Commit websiteData.json to GitHub (development branch)
- Use commit message from user
- Return commit SHA and version number
- Optionally update MongoDB (secondary)

**`frontend/src/app/api/versions/get-latest/route.ts`** (NEW)
- Get latest commit from development branch
- Load websiteData.json from latest commit
- Return websiteData object

#### 4.2 GitHub API Helper Functions

**File:** `frontend/src/lib/github/githubApi.ts` (in easy-money)

**Add functions:**
- `commitFileToGitHub()` - Commit single file
- `getCommitsFromBranch()` - Get commit list
- `getFileFromCommit()` - Get file content from commit
- `getLatestCommit()` - Get latest commit SHA

#### 4.3 Environment Variables

**File:** `frontend/.env` (in easy-money)

```env
GITHUB_TOKEN=your-token
GITHUB_USERNAME=your-username
TEMPLATE_REPO_OWNER=your-github-username
TEMPLATE_REPO_NAME=next-js-template
TEMPLATE_VERSION=v1.0.0
```

### Phase 3: Template Repo Tagging (This Repo)

#### 3.1 Create Initial Tag

```bash
# After template is stable
git tag v1.0.0
git push origin v1.0.0
```

#### 3.2 Version Workflow

1. Make changes to template
2. Test thoroughly
3. Commit changes
4. Tag new version: `git tag v1.1.0`
5. Push tag: `git push origin v1.1.0`
6. Update easy-money `.env` with new version

## Detailed Implementation Steps

### Step 1: Template Repo - Update Save Hook (GitHub First)

**Priority: CRITICAL**

**File:** `src/hooks/useWebsiteSave.ts`

**Changes:**
1. **Remove MongoDB-first approach**
2. **Commit to GitHub FIRST** (primary)
3. **Update MongoDB SECOND** (optional metadata)
4. **Reload from GitHub** after commit
5. **Error handling:** If GitHub fails, fail the save (GitHub is source of truth)

**Key Points:**
- GitHub commit is the save operation
- MongoDB is just metadata/cache
- websiteData.json goes to git
- Commit message = user's description

### Step 2: Template Repo - Update Version Control Panel

**Priority: CRITICAL**

**File:** `src/components/editor/versionControl/versionControlPanel.tsx`

**Changes:**
1. **Fetch from GitHub only** (`/api/versions/list-github`)
2. **Display commits as versions**
3. **Show commit SHA** (short format: `abc1234`)
4. **Show commit message** as change description
5. **Show commit date** and author
6. **Remove MongoDB fallback** (GitHub is required)

**UI Updates:**
- Add commit SHA display
- Show "View on GitHub" link (optional)
- Display commit diff info (optional)

### Step 3: Template Repo - Update Loader Hook

**Priority: HIGH**

**File:** `src/hooks/useWebsiteLoader.ts`

**Changes:**
1. **Check for version param** in URL
2. **If version exists:** Load from GitHub commit
3. **If no version:** Load latest from GitHub (or MongoDB fallback)
4. **websiteData.json from git**, not MongoDB

**Flow:**
- Version param → Load from commit SHA
- No version → Load latest commit
- Fallback → MongoDB (only if GitHub unavailable)

### Step 4: Easy-Money App - Create GitHub API Routes

**Priority: CRITICAL**

**Required Routes:**
1. `/api/versions/list-github` - Get commits
2. `/api/versions/switch-github` - Get file from commit
3. `/api/versions/create-github` - Commit file
4. `/api/versions/get-latest` - Get latest commit

**All routes:**
- Use GitHub API with auth
- Get repo name from MongoDB (via websiteId)
- Work with `development` branch
- Handle errors gracefully

### Step 5: Template Repo - Version Tagging

**Priority: LOW (Manual)**

1. Create initial tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Document process
4. Update when template changes

## Challenges & Considerations

### Challenge 1: GitHub is Required (No Fallback)

**Solution:** 
- Make GitHub API calls required
- Show clear error if GitHub unavailable
- Don't allow saves if GitHub fails
- MongoDB is optional metadata only

### Challenge 2: Development Branch Management

**Solution:**
- All editor saves go to `development` branch
- Production deploys from `main` branch
- Version control shows `development` branch commits
- Can merge `development` → `main` when ready

### Challenge 3: File Path Consistency

**Solution:**
- Always use `src/data/websiteData.json`
- Ensure path is consistent across all repos
- Handle path in GitHub API routes

### Challenge 4: Initial Commit

**Solution:**
- When repo is created, make initial commit
- Include websiteData.json in initial commit
- This becomes "Version 1"
- All subsequent saves create new commits

### Challenge 5: No MongoDB Dependency

**Solution:**
- GitHub is source of truth
- MongoDB can be removed entirely (optional)
- Or use MongoDB only for:
  - User metadata
  - Website settings
  - Non-versioned data
- websiteData.json lives in git only

## Migration Path

### For Existing Repos

1. **Create Initial Commit**
   - Take current websiteData.json from MongoDB
   - Commit to GitHub as initial commit
   - This becomes the baseline

2. **Switch to GitHub-First**
   - Update version control panel to use GitHub
   - Update save hook to commit to GitHub
   - Old MongoDB versions become read-only reference

3. **Optional: Backfill Commits**
   - Create commits for existing MongoDB versions
   - Link MongoDB versions to commits
   - Or just start fresh from initial commit

### For New Repos

1. **Start with GitHub**
   - Initial commit when repo is created
   - All saves create commits
   - No MongoDB versions needed
   - Clean implementation

## Testing Checklist

### Template Repo Tests

- [ ] Version control panel displays GitHub versions
- [ ] Can switch to GitHub version
- [ ] Save creates GitHub commit
- [ ] Version loading works with commit SHA
- [ ] Fallback to MongoDB if GitHub unavailable
- [ ] Commit messages display correctly
- [ ] Commit SHA displays in UI

### Easy-Money App Tests

- [ ] GitHub API routes work
- [ ] Repo creation uses template version
- [ ] Version list fetches from GitHub
- [ ] Version switch loads from commit
- [ ] Save commits to GitHub
- [ ] Error handling works
- [ ] Authentication works

## Benefits of GitHub-First Approach

1. **Single Source of Truth**
   - GitHub commits = versions
   - websiteData.json in git
   - No sync issues between MongoDB and git
   - Always accurate

2. **True Version Control**
   - Every save = git commit
   - Full git history
   - Can view diffs
   - Can revert to any commit
   - Standard git workflow

3. **Production Ready**
   - Code in git matches deployed code
   - Can deploy from any commit
   - Version control = git history
   - No abstraction layer

4. **Simpler Architecture**
   - MongoDB optional (metadata only)
   - GitHub is primary
   - Less complexity
   - Fewer failure points

5. **User Benefits**
   - See actual commit history
   - Commit messages are meaningful
   - Can view on GitHub
   - Standard version control

## Recommended Implementation Order

1. **Phase 1: Easy-Money API Routes** (CRITICAL - Must do first)
   - Create `/api/versions/list-github`
   - Create `/api/versions/switch-github`
   - Create `/api/versions/create-github`
   - Create `/api/versions/get-latest`
   - Test with GitHub API

2. **Phase 2: Template Repo - Save Hook** (CRITICAL)
   - Update `useWebsiteSave.ts`
   - Commit to GitHub FIRST
   - MongoDB SECOND (optional)
   - GitHub failure = save failure

3. **Phase 3: Template Repo - Version Panel** (HIGH)
   - Update `versionControlPanel.tsx`
   - Fetch from GitHub only
   - Display commits as versions
   - Show commit SHA and messages

4. **Phase 4: Template Repo - Loader Hook** (HIGH)
   - Update `useWebsiteLoader.ts`
   - Load from GitHub commits
   - Handle version param
   - MongoDB as fallback only

5. **Phase 5: Template Tagging** (LOW - Manual)
   - Create initial tag
   - Document process

## Key Principles

1. **GitHub is Source of Truth**
   - websiteData.json lives in git
   - Commits = versions
   - Save = commit

2. **MongoDB is Optional**
   - Can be removed entirely
   - Or used for metadata only
   - Not required for versioning

3. **No Hybrid Confusion**
   - GitHub is primary
   - MongoDB is secondary
   - Clear hierarchy

4. **Standard Git Workflow**
   - Development branch for edits
   - Main branch for production
   - Commits are versions
   - Standard git operations

## Notes for Template Repo

Since this is the **template repo**:

- **Can implement:** All UI and hook updates
- **Can't implement:** GitHub API routes (need auth in easy-money)
- **Will work:** Once easy-money has API routes
- **Approach:** GitHub-first, MongoDB-optional

The template repo code should:
- Commit to GitHub on save (via easy-money API)
- Load versions from GitHub (via easy-money API)
- Treat GitHub as source of truth
- Use MongoDB only for metadata (if at all)

