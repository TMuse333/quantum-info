# Git Scripts to GitHub API Migration

## Problem

The deployment system was using **git scripts** (via `execSync`) instead of the **GitHub API**. This caused several issues:

1. **Files written but git doesn't detect changes**: Files are identical to what's already in production, so git reports "no changes to commit"
2. **File system operations**: Writing files to disk triggers Next.js file watcher, causing server restarts
3. **Git lock file issues**: Concurrent git operations can cause lock file conflicts
4. **Not suitable for production**: Scripts require git CLI to be installed and configured

## Solution

Switched from `deployToProduction` (git scripts) to `deployToProductionViaAPI` (GitHub API).

## Files Changed

### 1. `frontend/src/app/api/production/deploy-stream/route.ts`
- **Before**: Imported `deployToProduction` from `git-operations.ts`
- **After**: Imports `deployToProductionViaAPI` from `github-api-operations.ts`
- **Changes**:
  - Converted `GeneratedFile[]` to `ComponentFileContent[]` format
  - Removed `force` parameter (not needed for API)
  - Updated error handling for API response format

### 2. Files Still Using Git Scripts (Should be removed or deprecated)

These files still contain git script operations but are **not currently being used**:

- `frontend/src/lib/deploy/git-operations.ts` - Re-exports all git script functions
- `frontend/src/lib/deploy/git-utils.ts` - Core git utilities (execSync)
- `frontend/src/lib/deploy/git-branch-operations.ts` - Branch operations via scripts
- `frontend/src/lib/deploy/git-file-operations.ts` - File writing operations
- `frontend/src/lib/deploy/git-commit-operations.ts` - Commit operations via scripts
- `frontend/src/lib/deploy/git-tag-operations.ts` - Tag operations via scripts
- `frontend/src/lib/deploy/git-push-operations.ts` - Push operations via scripts
- `frontend/src/lib/deploy/git-deployment.ts` - Main deployment orchestrator using scripts

**Note**: These files are kept for backward compatibility but should be removed if not needed elsewhere.

## GitHub API Approach Benefits

1. **No file system changes**: All operations happen in memory via API
2. **No server restarts**: Next.js file watcher not triggered
3. **Works in production**: No git CLI required
4. **Better error handling**: Network requests have built-in timeout handling
5. **Atomic operations**: All files committed in a single API call

## Current Deployment Flow

1. **Component Copying**: `copyProductionComponents()` - Reads `.prod.tsx` files
2. **File Generation**: `generateAllPageFiles()` - Generates page components, data files, routes
3. **Validation**: `validateProductionCodebase()` - Validates structure with Claude
4. **GitHub API Deployment**: `deployToProductionViaAPI()` - Commits via API

## Type Compatibility

- `GeneratedFile` (from `generatePageFiles.ts`): `{ path: string, content: string }`
- `ComponentFileContent` (from `copyComponents.ts`): `{ path: string, content: string }`
- Both are compatible and can be converted easily

## Environment Variables Required

- `GITHUB_TOKEN` - GitHub personal access token with repo permissions

## Next Steps

1. ✅ **DONE**: Switch `deploy-stream/route.ts` to use GitHub API
2. ⚠️ **TODO**: Check if any other routes use git scripts
3. ⚠️ **TODO**: Consider removing git script files if not needed
4. ⚠️ **TODO**: Update documentation to reflect API-only approach

