# Testing Readiness Analysis - Component Generation Flow

## Overview

This document analyzes what's implemented and what's missing to test the full component generation flow, including:
- Generating new components via Claude Code
- Preview and confirmation
- Undo functionality
- Committing to experiment branch
- Version navigation

## Current Implementation Status

### ✅ What's Implemented

1. **Claude Code API Route** (`/api/assistant/claude-code`)
   - Generates component code based on prompts
   - Returns file changes with paths, content, and actions
   - Includes full instructions from `component-intructions.md`

2. **Edit Classification** (`/api/assistant/determine-edit`)
   - Routes simple edits (text/color) to OpenAI
   - Routes structural changes to Claude Code

3. **Website Assistant UI**
   - Shows preview of structural changes
   - Accept/Reject buttons
   - Displays full prompt sent to Claude

4. **GitHub API Routes**
   - `/api/versions/create-github` - Creates commits
   - `/api/versions/list-github` - Lists commits
   - `/api/versions/switch-github` - Loads specific version
   - `/api/versions/get-latest` - Gets latest commit

5. **Version Control Panel**
   - Fetches versions from GitHub
   - Allows switching between versions

6. **Save Hook** (`useWebsiteSave`)
   - Handles both simple and structural changes
   - Commits to GitHub with appropriate messages

### ❌ What's Missing

#### 1. Apply File Changes to Filesystem (CRITICAL)

**Current State:**
- Line 401 in `websiteAssistant.tsx`: `// TODO: Apply file changes to actual files`
- Files are only committed to GitHub, not written locally first

**What's Needed:**
- API route to write files to local filesystem: `/api/files/apply-changes`
- When user accepts structural changes, write files locally
- Track which files were written for undo functionality

**Implementation:**
```typescript
// New API route: /api/files/apply-changes
POST {
  files: Array<{ path: string; content: string; action: "create" | "modify" | "delete" }>
}
// Writes files to filesystem, returns success/failure
```

#### 2. Undo Functionality (CRITICAL)

**Current State:**
- No tracking of file changes
- No way to undo accepted changes

**What's Needed:**
- Track file changes history in context/store
- Store original file content before changes
- Undo button that restores previous state
- API route to restore files: `/api/files/undo-changes`

**Implementation:**
```typescript
// In context.tsx
interface FileChangeHistory {
  timestamp: number;
  files: Array<{
    path: string;
    originalContent: string | null; // null if file was created
    newContent: string;
    action: "create" | "modify" | "delete";
  }>;
}

const [fileChangeHistory, setFileChangeHistory] = useState<FileChangeHistory[]>([]);
```

#### 3. Component Registration (HIGH PRIORITY)

**Current State:**
- `componentMap.tsx` must be manually updated
- No automatic registration when new component is created

**Why It's Needed:**
- `websiteData.json` stores component types as strings (e.g., `"type": "auroraImageHero"`)
- The `componentMap` converts the string type to the actual React component
- Without the map entry, components won't render (shows "Unknown component type" error)

**What's Needed:**
- When Claude generates a new component, also update `componentMap.tsx`
- Add import statement: `import { NewComponentEdit } from "@/components/designs/..."`
- Add entry to `componentMap` object: `newComponent: NewComponentEdit,`
- This should be part of the file changes returned by Claude

**Implementation:**
- Claude should include `componentMap.tsx` in the files array when creating new components
- The file change should add the import and map entry
- This is required for the component to actually render on the page

#### 4. Experiment Branch Support (MEDIUM PRIORITY)

**Current State:**
- Hardcoded to `'development'` branch in `useWebsiteSave.ts` (line 90)

**What's Needed:**
- Make branch configurable
- Default to `'experiment'` for this template repo
- Allow override via environment variable or config

**Implementation:**
```typescript
// In useWebsiteSave.ts
const branch = searchParams.get("branch") || 
               process.env.DEFAULT_GIT_BRANCH || 
               'experiment'; // Default to experiment for template repo
```

#### 5. Reload After Commit (MEDIUM PRIORITY)

**Current State:**
- After commit, state is updated but page doesn't reload from latest commit
- User might not see the committed changes immediately

**What's Needed:**
- After successful commit, reload website data from latest commit
- Update UI to reflect committed state
- Clear any pending changes

**Implementation:**
```typescript
// After successful commit in useWebsiteSave.ts
// Reload from latest commit
const reloadResponse = await fetch(`/api/versions/get-latest?repoOwner=${repoOwner}&repoName=${repoName}&branch=${branch}`);
if (reloadResponse.ok) {
  const data = await reloadResponse.json();
  setMaster(data.websiteData);
  // Clear pending changes
  setPreviewStructuralChanges(null);
}
```

#### 6. File Path Resolution (LOW PRIORITY)

**Current State:**
- File paths from Claude might be relative or absolute
- Need to ensure paths are correct for this repo structure

**What's Needed:**
- Normalize file paths (ensure they're relative to repo root)
- Handle both `src/` and `frontend/src/` paths
- Validate paths before writing

## Required Implementation Order

### Phase 1: File Operations (CRITICAL - Must do first)

1. **Create `/api/files/apply-changes` route**
   - Write files to filesystem
   - Handle create, modify, delete actions
   - Return success/failure for each file

2. **Update Website Assistant to apply files on accept**
   - Call `/api/files/apply-changes` when user accepts
   - Show success/error messages
   - Track changes for undo

3. **Create file change tracking**
   - Store original file content before changes
   - Track in context/store
   - Enable undo functionality

### Phase 2: Undo Functionality

4. **Create `/api/files/undo-changes` route**
   - Restore files from history
   - Handle file deletion (if file was created, delete it)
   - Handle file restoration (if file was deleted, restore it)

5. **Add Undo button to UI**
   - Show when there are file changes
   - Call undo API route
   - Update UI after undo

### Phase 3: Component Registration

6. **Update Claude instructions**
   - Ensure Claude includes `componentMap.tsx` update when creating components
   - Add import and map entry automatically

### Phase 4: Branch Configuration

7. **Make branch configurable**
   - Add environment variable support
   - Default to 'experiment' for template repo
   - Update all GitHub API calls to use configurable branch

### Phase 5: Post-Commit Reload

8. **Reload from latest commit after save**
   - Fetch latest commit after successful save
   - Update store with committed data
   - Clear pending changes

## Testing Checklist

Once all phases are implemented, you should be able to:

- [ ] Request a new component via Claude Code
- [ ] See preview of generated files
- [ ] Accept changes → Files written to filesystem
- [ ] See new component in the UI (if registered correctly)
- [ ] Click "Undo" → Files restored to previous state
- [ ] Click "Save Changes" → Commit to experiment branch
- [ ] See commit in Version Control Panel
- [ ] Switch to previous version → See old state
- [ ] Switch back to latest → See committed changes
- [ ] After commit, automatically be on latest version

## Files That Need to Be Created/Modified

### New Files:
1. `/api/files/apply-changes/route.ts` - Write files to filesystem
2. `/api/files/undo-changes/route.ts` - Restore files from history

### Files to Modify:
1. `websiteAssistant.tsx` - Apply files on accept, add undo button
2. `context.tsx` - Add file change history tracking
3. `useWebsiteSave.ts` - Make branch configurable, reload after commit
4. `componentMap.tsx` - Will be auto-updated by Claude (but verify)

## Environment Variables Needed

```env
GITHUB_TOKEN=your-token
ANTHROPIC_API_KEY=your-claude-key
OPENAI_KEY=your-openai-key
DEFAULT_GIT_BRANCH=experiment  # Optional, defaults to 'experiment'
```

## Summary

**You're about 70% ready to test.** The main missing pieces are:

1. **File operations** - Writing files to filesystem when accepted
2. **Undo functionality** - Tracking and reverting changes
3. **Component registration** - Auto-updating componentMap.tsx
4. **Branch configuration** - Support for experiment branch
5. **Post-commit reload** - Refresh state after commit

The core flow (generate → preview → commit) works, but you need file operations and undo to have a complete testing experience.

