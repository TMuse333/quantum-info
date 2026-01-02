# Multi-User Branch Considerations

## Overview

When the system is live, each user will have:
- **Their own separate repository** (completely isolated from other users)
- **Their own deployment instance** (e.g., `user.web-editor.companyName.com`)
- **Two branches within their own repo**:
  - **Development branch** (live on their subdomain: `user.web-editor.companyName.com`)
  - **Production branch** (live on their main domain: `theirCompanyName.com`)
- **No experiment branch** (experiment branch is only for owner/development)

## Architecture

### Repository Strategy
- **Owner/Development**: Uses `experiment` branch in the template repo for testing
- **Users**: Each user gets their own **separate repository** with:
  - Development branch (deployed to subdomain)
  - Production branch (deployed to main domain)
- No conflicts between users because each has their own repo

### Configuration

Each user's deployment has their own environment variables pointing to their repository:

```typescript
// frontend/src/lib/config.ts
export const GITHUB_CONFIG = {
  REPO_OWNER: process.env.REPO_OWNER || "TMuse333",  // User's GitHub username or org
  REPO_NAME: process.env.REPO_NAME || "next-js-template",  // User's specific repo name
  CURRENT_BRANCH: process.env.CURRENT_BRANCH || "development",  // User's dev branch
  PRODUCTION_BRANCH: process.env.PRODUCTION_BRANCH || "production",  // User's prod branch
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",  // User's GitHub token (or shared service token)
  // ... other config
}
```

**Example for User "Acme Corp":**
- `REPO_OWNER`: `acme-corp` (or `TMuse333` if using a shared org)
- `REPO_NAME`: `acme-corp-website`
- `CURRENT_BRANCH`: `development` (deployed to `acme.web-editor.companyName.com`)
- `PRODUCTION_BRANCH`: `production` (deployed to `acmecorp.com`)

## Considerations for Multi-User Setup

### 1. Repository and Branch Naming

**Since each user has their own repository, branch naming is simpler:**

**Recommended Pattern:**
- Development branch: `development` or `dev` (standard name, no conflicts since each user has own repo)
- Production branch: `production` or `main` (standard name)

**Example:**
- User "Acme Corp" has repo `acme-corp-website`:
  - `development` branch → deployed to `acme.web-editor.companyName.com`
  - `production` branch → deployed to `acmecorp.com`
- User "TechStart" has repo `techstart-website`:
  - `development` branch → deployed to `techstart.web-editor.companyName.com`
  - `production` branch → deployed to `techstart.com`

### 2. Version Numbers

**Current Behavior:**
- Version numbers are branch-specific (count of commits in that branch)
- Each branch maintains its own version sequence (1, 2, 3, ...)
- Version numbers reset if a branch is recreated

**Considerations:**
- ✅ **Good**: Each user's repository is completely isolated
- ✅ **Good**: Version numbers are sequential per branch within each user's repo
- ✅ **Good**: No conflicts between users (different repos)
- ⚠️ **Note**: If a user's branch is deleted and recreated, version numbers start at 1 again
- ⚠️ **Note**: Version numbers are per-repo (User A's v5 is different from User B's v5, but that's fine since they're in different repos)

### 3. API Route Branch Validation

**Current Implementation:**
```typescript
// frontend/src/app/api/versions/list-github/route.ts
const validBranches = ['experiment', 'main', 'master', 'development', 'dev'];
const branch = (branchParam && validBranches.includes(branchParam))
  ? branchParam
  : CURRENT_BRANCH;
```

**Issue**: This hardcodes branch names. Since each user has their own repo, we can simplify this.

**Fix Needed:**
- Remove hardcoded branch validation (or keep it simple with standard names)
- Each user's deployment only accesses their own repo (via `REPO_NAME` env var)
- No need for complex validation since repos are isolated

### 4. Security Considerations

**Repository Access Control:**
- Each user's deployment only has access to their own repository (via `REPO_NAME` env var)
- No need to validate branch ownership since each user only accesses their own repo
- GitHub token should be scoped to only access the user's repository (or use a service account with repo-specific permissions)

**Security Model:**
- ✅ **Isolated**: Each user's deployment can only access their own repo
- ✅ **Simple**: No complex branch validation needed
- ✅ **Secure**: Repository-level isolation prevents cross-user access

**Note**: If using a shared GitHub token/service account, ensure it has proper repository-level permissions and access controls.

### 5. Environment Variables Per User

**Setup:**
- Each user's deployment has their own environment variables set at deployment time
- Each user has their own `REPO_OWNER` and `REPO_NAME` pointing to their repository
- Each user has their own `CURRENT_BRANCH` (development) and `PRODUCTION_BRANCH` (production)

**Example Environment Variables for User "Acme Corp":**
```bash
REPO_OWNER=acme-corp
REPO_NAME=acme-corp-website
CURRENT_BRANCH=development
PRODUCTION_BRANCH=production
GITHUB_TOKEN=ghp_...
```

**Deployment:**
- Each user gets their own Vercel/deployment instance
- Environment variables are set per-deployment
- No shared state between users

### 6. Version Control Panel

**Current Behavior:**
- Shows versions from `CURRENT_BRANCH` (user's development branch)
- Allows switching between versions
- Displays "Current: v{number}"

**Multi-User Considerations:**
- ✅ Version list is branch-specific (already works)
- ✅ Version switching works per branch
- ✅ Each user only sees versions from their own repository (via `REPO_NAME` env var)
- ✅ No changes needed - already isolated per deployment

### 7. Save Operations

**Current Flow:**
1. User makes edits
2. Clicks "Save Changes"
3. Commits to `CURRENT_BRANCH` (development branch in their repo)
4. Version number increments

**Multi-User Considerations:**
- ✅ Each user saves to their own repository (via `REPO_NAME` env var)
- ✅ Each user saves to their own development branch
- ✅ Version numbers are independent per branch/repo
- ✅ No changes needed - already isolated per deployment

### 8. Production Deployment

**Current Flow:**
1. User clicks "Deploy to Production"
2. System generates production files
3. Pushes to `PRODUCTION_BRANCH` in user's repository (from config)
4. Production branch is deployed to user's main domain (e.g., `acmecorp.com`)

**Multi-User Considerations:**
- ✅ Each user deploys to their own production branch in their own repository
- ✅ No conflicts between users (different repos)
- ✅ Each user's production branch is deployed to their own domain
- ✅ No changes needed - already isolated per deployment

## Recommended Implementation

### 1. Simplify Branch Validation

**File**: `frontend/src/app/api/versions/list-github/route.ts`
```typescript
// BEFORE
const validBranches = ['experiment', 'main', 'master', 'development', 'dev'];
const branch = (branchParam && validBranches.includes(branchParam))
  ? branchParam
  : CURRENT_BRANCH;

// AFTER (simplified - each user has their own repo)
const branch = branchParam || CURRENT_BRANCH;
// No complex validation needed since each deployment only accesses its own repo
```

**Rationale**: Since each user has their own repository, we don't need strict branch validation. The deployment's `REPO_NAME` env var ensures isolation.

### 2. Repository Isolation (Already Handled)

**No changes needed** - Each deployment's environment variables (`REPO_OWNER`, `REPO_NAME`) ensure users only access their own repository.

### 3. Standard Branch Names

**Recommendation**: Use standard branch names across all users:
- Development: `development` or `dev`
- Production: `production` or `main`

This simplifies the codebase and makes it easier to understand. Since each user has their own repo, there are no naming conflicts.

### 4. Deployment Setup

**Per-User Deployment Configuration:**
- Each user gets their own Vercel/deployment instance
- Environment variables are set per-deployment:
  - `REPO_OWNER`: User's GitHub username or organization
  - `REPO_NAME`: User's repository name
  - `CURRENT_BRANCH`: `development` (standard)
  - `PRODUCTION_BRANCH`: `production` (standard)
  - `GITHUB_TOKEN`: User's token or service account token with repo access

## Testing Checklist

- [ ] Each user's deployment can access only their own repository
- [ ] User can save to their own development branch
- [ ] User can deploy to their own production branch
- [ ] Version numbers are correct per branch within each user's repo
- [ ] User cannot access other users' repositories (repository-level isolation)
- [ ] Version control panel shows correct versions for user's branch
- [ ] No conflicts when multiple users deploy simultaneously (different repos)
- [ ] Development branch deploys to user's subdomain (e.g., `user.web-editor.companyName.com`)
- [ ] Production branch deploys to user's main domain (e.g., `theirCompanyName.com`)

## Migration Path

1. **Phase 1**: Remove hardcoded branch validation (simplify to standard names)
2. **Phase 2**: Set up per-user repository creation (automated or manual)
3. **Phase 3**: Configure per-user deployments with environment variables
4. **Phase 4**: Test repository isolation (ensure users can't access each other's repos)
5. **Phase 5**: Test with multiple users simultaneously

## Key Differences from Original Assumption

**Original (Incorrect)**: All users share one repo with user-specific branches
**Actual**: Each user has their own separate repository

**Benefits of Actual Architecture:**
- ✅ Simpler security model (repository-level isolation)
- ✅ No branch naming conflicts
- ✅ Easier to manage (each user is completely independent)
- ✅ Better scalability (users don't affect each other)
- ✅ Standard branch names (no need for user-specific naming)

