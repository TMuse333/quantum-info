# GitHub Architecture Refactor - Single-Tenant Per Deployment

## Overview

This document outlines the necessary changes to simplify the GitHub integration for a **single-tenant per deployment** architecture, where each user gets their own deployed instance of this template.

---

## Current vs Proposed Architecture

### Current (Incorrect Assumption)
- **Multi-tenant editor**: One app, many users
- **Dynamic repo selection**: URL params `?repoOwner=...&repoName=...`
- **Repo detection**: Auto-detect or fallback logic
- **User management**: Database of users and websites within this app

### Proposed (Actual Architecture)
- **Single-tenant per deployment**: Each user gets their own instance
- **Static repo configuration**: Set via environment variables at deployment
- **No repo detection needed**: Parent app configures it once
- **User already authenticated**: Session from parent app

---

## System Flow

### 1. Parent App (Separate Next.js App)
```
User creates account → NextAuth authentication
         ↓
User subscribes/pays
         ↓
Parent App:
  - Creates repo: TMuse333/client-project-demo (GitHub API)
  - Deploys repo to Vercel (Vercel API)
  - Sets env vars: REPO_OWNER, REPO_NAME, etc.
  - Domain: client-project-demo.companyname.com
```

### 2. This Template App (Per-User Deployment)
```
User visits: client-project-demo.companyname.com
         ↓
Already authenticated (session from parent)
         ↓
Edits their website
         ↓
Saves → Commits to TMuse333/client-project-demo (experiment branch)
         ↓
Ready to publish → Push experiment → main (production)
```

---

## Required Changes

### 1. Environment Variable Configuration

**Set by Parent App at Deployment:**

```env
# Core repo config (REQUIRED)
REPO_OWNER=TMuse333
REPO_NAME=client-project-demo

# Branch strategy
CURRENT_BRANCH=experiment
PRODUCTION_BRANCH=main

# User/project context
USER_ID=user_123
PROJECT_ID=project_abc
COMPANY_NAME=yourcompany

# GitHub access (shared secret)
GITHUB_TOKEN=ghp_xxx

# Auth (if using JWT)
NEXT_PUBLIC_USER_TOKEN=eyJhbGc...
# OR (if using shared NextAuth)
NEXTAUTH_SECRET=shared-secret
NEXTAUTH_URL=https://client-project-demo.companyname.com
```

**Add Configuration File:**

```typescript
// lib/config.ts
export const GITHUB_CONFIG = {
  REPO_OWNER: process.env.REPO_OWNER || "TMuse333",
  REPO_NAME: process.env.REPO_NAME!,  // Required
  CURRENT_BRANCH: process.env.CURRENT_BRANCH || "experiment",
  PRODUCTION_BRANCH: process.env.PRODUCTION_BRANCH || "main",
  USER_ID: process.env.USER_ID,
  PROJECT_ID: process.env.PROJECT_ID,
} as const;

// Validate on startup
if (!GITHUB_CONFIG.REPO_NAME) {
  throw new Error("REPO_NAME environment variable must be set");
}
```

---

### 2. Code to Remove

#### Delete Files:
- `src/app/api/git/repo-info/route.ts` - No longer needed

#### Remove from Components:
```typescript
// ❌ Remove URL param handling
const repoOwner = searchParams.get("repoOwner");
const repoName = searchParams.get("repoName");

// ❌ Remove state management for repo
const [repoOwner, setRepoOwner] = useState<string | null>(null);
const [repoName, setRepoName] = useState<string | null>(null);

// ❌ Remove auto-detection logic
useEffect(() => {
  const detectRepoInfo = async () => {
    const response = await fetch("/api/git/repo-info");
    // ...
  };
  detectRepoInfo();
}, []);

// ❌ Remove fallback logic
const currentRepoOwner = searchParams.get("repoOwner") || websiteData?.repoOwner || "TMuse333";

// ❌ Remove from websiteData
websiteData.repoOwner
websiteData.repoName
```

#### Files to Update:
- `src/components/editor/versionControl/versionControlPanel.tsx`
- `src/hooks/useWebsiteSave.ts`
- `src/hooks/useWebsiteLoader.ts`
- `src/stores/slices/websiteDataSlice.ts`
- `src/app/api/versions/list-github/route.ts`
- `src/app/api/versions/switch-github/route.ts`
- `src/app/api/versions/create-github/route.ts`
- `src/app/api/versions/get-latest/route.ts`

---

### 3. Code to Simplify

#### Before (Complex):
```typescript
// Version Control Panel
const [repoOwner, setRepoOwner] = useState<string | null>(
  searchParams.get("repoOwner") || websiteData?.repoOwner || "TMuse333"
);
const [repoName, setRepoName] = useState<string | null>(
  searchParams.get("repoName") || websiteData?.repoName || "next-js-template"
);

// Auto-detect on mount
useEffect(() => {
  const detectRepoInfo = async () => {
    if (repoOwner && repoName) return;

    const response = await fetch("/api/git/repo-info");
    if (response.ok) {
      const data = await response.json();
      setRepoOwner(data.repoOwner);
      setRepoName(data.repoName);
    }
  };
  detectRepoInfo();
}, []);

// When switching versions
const handleSwitchVersion = async (versionNumber: number) => {
  const currentRepoOwner = searchParams.get("repoOwner") || websiteData?.repoOwner;
  const currentRepoName = searchParams.get("repoName") || websiteData?.repoName;

  if (!currentRepoOwner || !currentRepoName) {
    alert("Cannot switch version: Repository information not found.");
    return;
  }
  // ...
};
```

#### After (Simple):
```typescript
import { GITHUB_CONFIG } from "@/lib/config";

// No state needed!
const { REPO_OWNER, REPO_NAME, CURRENT_BRANCH } = GITHUB_CONFIG;

// No auto-detection needed!

// When switching versions
const handleSwitchVersion = async (versionNumber: number) => {
  const { REPO_OWNER, REPO_NAME } = GITHUB_CONFIG;

  // Always has values - no need to check!
  const response = await fetch('/api/versions/switch-github', {
    body: JSON.stringify({ versionNumber })
    // API already knows repo from env vars
  });
};
```

#### API Routes Simplified:
```typescript
// Before
export async function GET(req: NextRequest) {
  const repoOwner = req.nextUrl.searchParams.get("repoOwner");
  const repoName = req.nextUrl.searchParams.get("repoName");

  if (!repoOwner || !repoName) {
    return NextResponse.json({ error: "Missing repo info" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/commits`,
    // ...
  );
}

// After
import { GITHUB_CONFIG } from "@/lib/config";

export async function GET(req: NextRequest) {
  const { REPO_OWNER, REPO_NAME, CURRENT_BRANCH } = GITHUB_CONFIG;

  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${CURRENT_BRANCH}`,
    // ...
  );
}
```

---

### 4. URL Structure Changes

#### Before (Complex):
```
https://client-project-demo.companyname.com/editor?repoOwner=TMuse333&repoName=client-project-demo&branch=experiment&version=11
```

#### After (Clean):
```
https://client-project-demo.companyname.com/editor           # Latest on experiment
https://client-project-demo.companyname.com/editor?v=11      # Version 11
https://client-project-demo.companyname.com                  # Public view (main branch)
```

---

### 5. Version Control Simplified

#### Current Issues:
- Shows "Current: v11" when 27 versions exist
- Error: "Repository information not found" when switching versions
- Version numbers confusing (tied to commit count)

#### Fixes:

**Issue 1: Current Version Display**
```typescript
// Before - checks URL param first, persists old version
const urlVersion = searchParams.get("version");
const currentVersion = urlVersion
  ? parseInt(urlVersion)
  : (websiteData?.currentVersionNumber ?? versions[0].versionNumber);

// After - always show latest unless viewing specific version
const urlVersion = searchParams.get("v");
const currentVersion = urlVersion
  ? parseInt(urlVersion)
  : (versions.length > 0 ? versions[0].versionNumber : 1);
```

**Issue 2: Repo Info Not Found**
```typescript
// Before - no fallback
const currentRepoOwner = searchParams.get("repoOwner") || websiteData?.repoOwner;
if (!currentRepoOwner || !currentRepoName) {
  alert("Cannot switch version: Repository information not found.");
  return;
}

// After - always has values from env
const { REPO_OWNER, REPO_NAME } = GITHUB_CONFIG;
// No need to check - always defined!
```

**Issue 3: Version Numbering**
```typescript
// Both list-github and switch-github should fetch same number of commits
// Currently: list (30) vs switch (100) causes mismatch

// Standardize to 100 commits in both
const PER_PAGE = 100;
```

---

## New Features to Add

### 1. Branch Indicator UI

```tsx
// src/components/editor/BranchIndicator.tsx
export default function BranchIndicator() {
  const { CURRENT_BRANCH, PRODUCTION_BRANCH } = GITHUB_CONFIG;
  const [publishing, setPublishing] = useState(false);

  const publishToProduction = async () => {
    // Merge experiment → main
    // OR create pull request
    // OR trigger Vercel production deployment
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <span className="text-gray-600">Branch:</span>
        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
          {CURRENT_BRANCH}
        </span>
      </div>

      <button
        onClick={publishToProduction}
        disabled={publishing}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {publishing ? "Publishing..." : "Publish to Production →"}
      </button>
    </div>
  );
}
```

### 2. Production Preview Link

```tsx
// Link to live site (main branch deployment)
<a
  href={`https://${GITHUB_CONFIG.REPO_NAME}.companyname.com`}
  target="_blank"
  className="text-blue-600 hover:underline"
>
  View Live Site →
</a>
```

### 3. Deployment Status

```tsx
// After saving
<div className="status-message">
  ✓ Saved to {CURRENT_BRANCH} branch
  <br />
  Preview: https://{REPO_NAME}.companyname.com/preview
</div>
```

---

## Authentication Integration

### Option A: JWT Token (Recommended)

**Parent App:**
```typescript
// Create JWT with user info
const token = jwt.sign(
  { userId: "user_123", projectId: "project_abc" },
  SECRET_KEY,
  { expiresIn: "30d" }
);

// Set as env var when deploying
await vercel.setEnvVariable("NEXT_PUBLIC_USER_TOKEN", token);
```

**This Template:**
```typescript
// Validate JWT on protected routes
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("user_token")?.value;

  if (!token) {
    return NextResponse.redirect("/unauthorized");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // User is authenticated
  } catch (error) {
    return NextResponse.redirect("/unauthorized");
  }
}
```

### Option B: Shared NextAuth Session

**Both apps use same NextAuth config:**
```typescript
// Same session database
// Same secret key
// User authenticated in parent app = authenticated here
```

### Option C: Session Cookie Domain

**Parent app sets cookie for `.companyname.com`:**
```typescript
res.setHeader("Set-Cookie", `session=...; Domain=.companyname.com`);
// All subdomains can read it
```

---

## Parent App Responsibilities

### When User Subscribes:

1. **Create GitHub Repo**
```typescript
await fetch("https://api.github.com/user/repos", {
  method: "POST",
  headers: { Authorization: `token ${GITHUB_TOKEN}` },
  body: JSON.stringify({
    name: "client-project-demo",
    private: true,
    description: "Website for Client Project Demo",
  })
});
```

2. **Copy Template Files**
```typescript
// Clone template repo contents into new repo
// OR use GitHub template repository feature
```

3. **Deploy to Vercel**
```typescript
await vercel.deployProject({
  name: "client-project-demo",
  gitSource: {
    type: "github",
    repo: "TMuse333/client-project-demo"
  },
  env: {
    REPO_OWNER: "TMuse333",
    REPO_NAME: "client-project-demo",
    CURRENT_BRANCH: "experiment",
    PRODUCTION_BRANCH: "main",
    USER_ID: userId,
    PROJECT_ID: projectId,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    // Auth
    NEXTAUTH_SECRET: sharedSecret,
  },
  domains: ["client-project-demo.companyname.com"]
});
```

4. **Store Deployment Info**
```typescript
// In parent app database
await db.projects.create({
  userId,
  repoName: "client-project-demo",
  deploymentUrl: "https://client-project-demo.companyname.com",
  vercelProjectId: "prj_xxx",
  status: "active"
});
```

---

## Migration Checklist

### Phase 1: Environment Configuration
- [ ] Add `lib/config.ts` with GITHUB_CONFIG
- [ ] Add startup validation for required env vars
- [ ] Update `.env.example` with new required variables

### Phase 2: Remove Old Code
- [ ] Delete `api/git/repo-info/route.ts`
- [ ] Remove `repoOwner`/`repoName` from URL params handling
- [ ] Remove state management for repo info
- [ ] Remove auto-detection logic
- [ ] Remove fallback logic chains

### Phase 3: Simplify Existing Code
- [ ] Update `versionControlPanel.tsx` to use GITHUB_CONFIG
- [ ] Update `useWebsiteSave.ts` to use GITHUB_CONFIG
- [ ] Update `useWebsiteLoader.ts` to use GITHUB_CONFIG
- [ ] Update all API routes to use GITHUB_CONFIG
- [ ] Update `websiteDataSlice.ts` to use GITHUB_CONFIG

### Phase 4: Fix Version Control Issues
- [ ] Fix current version detection (prioritize latest)
- [ ] Standardize commit fetching (100 commits in both APIs)
- [ ] Remove `currentVersionNumber` from localStorage
- [ ] Simplify version switching logic

### Phase 5: Add New Features
- [ ] Branch indicator component
- [ ] Publish to production flow
- [ ] Production preview link
- [ ] Deployment status messages

### Phase 6: Authentication
- [ ] Integrate with parent app authentication
- [ ] Add middleware for protected routes
- [ ] Handle session validation

### Phase 7: Testing
- [ ] Test with environment variables set
- [ ] Test version switching
- [ ] Test saving/committing
- [ ] Test branch management
- [ ] Test without URL params

---

## Benefits After Refactor

### Before:
❌ Complex repo detection logic
❌ URL params required (`?repoOwner=...&repoName=...`)
❌ Confusing fallbacks and state management
❌ "Repository information not found" errors
❌ Version numbering issues
❌ Multi-tenant complexity for single-tenant use case

### After:
✅ Simple environment variable configuration
✅ Clean URLs (no repo params needed)
✅ No state management for repo info
✅ Repo info always available
✅ Clear version numbering
✅ Single-tenant architecture matches deployment model
✅ Faster, more reliable, easier to maintain

---

## Notes

- Each deployment is completely isolated (single-tenant)
- No need for user/website database within this app
- Repo owner is always "TMuse333" (hardcoded constant)
- Repo name is set once at deployment time
- Users never see or interact with GitHub directly
- Authentication handled by parent app
- Version control per branch (experiment vs main)
- Ready for production deployment workflow

---

## Questions for Parent App Team

1. What authentication method will be used? (JWT, shared NextAuth, cookie domain)
2. What is the exact domain structure? (`*.companyname.com` or `companyname.com/*`)
3. Should we auto-create the experiment and main branches?
4. What should happen when user clicks "Publish to Production"? (PR, direct merge, or Vercel trigger)
5. Do we need webhook notifications back to parent app? (on save, on publish, etc.)
