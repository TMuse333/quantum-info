# Vercel Deployment Integration Flow

This document shows how the new Vercel API integration fits into the existing deployment system.

---

## Overview

The deployment system now has **two deployment targets**:

1. **GitHub API** (existing) - Saves changes to GitHub repository
2. **Vercel** (new) - Deploys to live Vercel hosting

---

## Architecture

### Two Vercel Projects Per User

Each user gets **TWO** Vercel projects:

1. **Development Editor**: `{userId}-editor.vercel.app`
   - Runs on `development` branch
   - Used for editing the website
   - Created ONCE during user onboarding

2. **Production Site**: `{userId}-production.vercel.app` or custom domain
   - Runs on `main` branch
   - Live website that users see
   - Deployed every time user clicks "Deploy to Production"

---

## Deployment Flow

### Current Flow (GitHub API only)

```
User clicks "Deploy"
  → Auto-save unsaved changes (Phase 1)
  → Save production snapshot (Phase 2)
  → Show deployment modal
  → Deploy to GitHub (push to main branch)
  → Show success
```

### New Flow (GitHub + Vercel)

```
User clicks "Deploy to Production"
  → Auto-save unsaved changes (Phase 1)
  → Save production snapshot (Phase 2)
  → Show deployment modal with multiple stages:
      1. ✅ Saving to GitHub
      2. 🔍 Validating build (Claude Code placeholder)
      3. 🚀 Deploying to Vercel
      4. 🌐 Assigning domain (if custom domain)
      5. ✅ Production live!
```

---

## API Routes

### 1. Deploy Development Editor (One-time setup)

**Endpoint**: `POST /api/vercel/deploy-editor`

**When to call**: During user onboarding, when creating a new user account

**Request**:
```json
{
  "userId": "client1",
  "githubOwner": "yourcompany",
  "githubRepo": "client1-website",
  "githubToken": "ghp_xxxxx",
  "customDomain": "client1-dev.yourcompany.com" // Optional
}
```

**Response**:
```json
{
  "success": true,
  "projectId": "prj_xxxxx",
  "deploymentId": "dpl_xxxxx",
  "editorUrl": "https://client1-dev.yourcompany.com",
  "vercelUrl": "https://client1-editor.vercel.app"
}
```

**Example usage**:
```typescript
async function onboardNewUser(userId: string) {
  // 1. Create GitHub repo for user
  const repo = await createGitHubRepo(userId);

  // 2. Deploy development editor to Vercel
  const editorDeployment = await fetch('/api/vercel/deploy-editor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      githubOwner: 'yourcompany',
      githubRepo: repo.name,
      githubToken: repo.token,
      customDomain: `${userId}-dev.yourcompany.com`,
    }),
  });

  const result = await editorDeployment.json();

  // 3. Send welcome email with editor URL
  await sendWelcomeEmail(userId, result.editorUrl);
}
```

---

### 2. Deploy Production Site (Every deployment)

**Endpoint**: `POST /api/vercel/deploy-production`

**When to call**: Every time user clicks "Deploy to Production" button

**Request**:
```json
{
  "userId": "client1",
  "githubOwner": "yourcompany",
  "githubRepo": "client1-website",
  "githubToken": "ghp_xxxxx",
  "customDomain": "client1.com", // Optional
  "validateBuild": true, // Run build validation
  "autoFixErrors": true  // Use Claude Code to auto-fix
}
```

**Response (Success)**:
```json
{
  "success": true,
  "projectId": "prj_xxxxx",
  "deploymentId": "dpl_xxxxx",
  "productionUrl": "https://client1.com",
  "vercelUrl": "https://client1-production.vercel.app",
  "buildValidation": {
    "passed": true,
    "autoFixed": false // No errors to fix
  }
}
```

**Response (Build Failed, Auto-fixed)**:
```json
{
  "success": true,
  "projectId": "prj_xxxxx",
  "deploymentId": "dpl_xxxxx",
  "productionUrl": "https://client1.com",
  "vercelUrl": "https://client1-production.vercel.app",
  "buildValidation": {
    "passed": true,
    "autoFixed": true,
    "fixAttempts": 2,
    "errors": [
      "TypeScript error: Property 'onClick' does not exist on type 'ButtonProps'",
      "ESLint error: 'React' is not defined"
    ]
  }
}
```

**Response (Build Failed, Could Not Fix)**:
```json
{
  "success": false,
  "error": "Build validation failed. Fix errors before deploying to production.",
  "buildValidation": {
    "passed": false,
    "autoFixed": false,
    "fixAttempts": 3,
    "errors": [
      "Syntax error: Unexpected token '}' at line 42"
    ]
  }
}
```

---

## Integration with Existing Deployment Modal

### Update `AnimatedDeployModal.tsx`

The existing deployment modal needs to be updated to include Vercel deployment stages:

```typescript
// src/components/deployment/AnimatedDeployModal.tsx

const deploymentStages = [
  {
    id: 'github',
    label: 'Saving to GitHub',
    icon: '📁',
  },
  {
    id: 'validate', // NEW STAGE
    label: 'Validating build',
    icon: '🔍',
  },
  {
    id: 'vercel', // NEW STAGE
    label: 'Deploying to Vercel',
    icon: '🚀',
  },
  {
    id: 'domain', // NEW STAGE (conditional)
    label: 'Assigning domain',
    icon: '🌐',
  },
  {
    id: 'complete',
    label: 'Deployment complete!',
    icon: '✅',
  },
];

async function deployToProduction() {
  // Stage 1: GitHub
  setCurrentStage('github');
  await fetch('/api/production/deploy-github', { /* ... */ });

  // Stage 2: Build validation (Claude Code placeholder)
  setCurrentStage('validate');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate validation

  // Stage 3: Vercel deployment
  setCurrentStage('vercel');
  const vercelResult = await fetch('/api/vercel/deploy-production', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: process.env.NEXT_PUBLIC_USER_ID,
      githubOwner: process.env.GITHUB_OWNER,
      githubRepo: process.env.GITHUB_REPO,
      githubToken: process.env.GITHUB_TOKEN,
      customDomain: process.env.CUSTOM_DOMAIN, // Optional
      validateBuild: true,
      autoFixErrors: true,
    }),
  });

  const result = await vercelResult.json();

  if (!result.success) {
    // Show error with build validation details
    setError(result.error);
    if (result.buildValidation?.errors) {
      setErrors(result.buildValidation.errors);
    }
    return;
  }

  // Stage 4: Domain assignment (if custom domain)
  if (process.env.CUSTOM_DOMAIN) {
    setCurrentStage('domain');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Stage 5: Complete!
  setCurrentStage('complete');
  setProductionUrl(result.productionUrl);
}
```

---

## Claude Code Integration Points

### Where Claude Code Fits In

The Claude Code build validation happens in `deploy-production.ts` at this location:

```typescript
// src/lib/vercel/deploy-production.ts

export async function deployProduction({ ... }) {
  // ============================================================================
  // STEP 1: BUILD VALIDATION (with Claude Code auto-fix)
  // ============================================================================
  if (validateBuild) {
    const buildValidationResult = await validateAndFixBuild({
      githubOwner,
      githubRepo,
      githubToken,
      branch: 'main',
      autoFix: autoFixErrors,
    });

    if (!buildValidationResult.passed) {
      // Build failed and couldn't auto-fix
      return { success: false, buildValidation: buildValidationResult, ... };
    }
  }

  // Continue with Vercel deployment...
}
```

### Placeholder Implementation

Currently, `validateAndFixBuild()` is a **PLACEHOLDER** that always returns success:

```typescript
async function validateAndFixBuild(params) {
  // TODO: Implement actual build validation
  // When ready, this should:
  // 1. Clone repo to temp directory
  // 2. Run `npm run build`
  // 3. Parse errors
  // 4. If autoFix=true, call Claude Code API to fix errors
  // 5. Commit fixes and retry build
  // 6. Return validation result

  return { passed: true }; // TEMPORARY
}
```

### Future Implementation

When implementing Claude Code integration:

1. Install dependencies:
```bash
npm install @anthropic-ai/sdk simple-git
```

2. Add environment variable:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

3. Implement the validation logic (see detailed example in `deploy-production.ts`)

---

## Environment Variables

### Required for Vercel Deployment

Add to `.env.local`:

```env
# Vercel API
VERCEL_API_TOKEN=xxxxx  # Get from vercel.com/account/tokens
VERCEL_TEAM_ID=team_xxxxx  # Optional, for team accounts

# GitHub (already exists)
GITHUB_TOKEN=ghp_xxxxx
GITHUB_OWNER=yourcompany
GITHUB_REPO=client1-website

# User Info (already exists)
NEXT_PUBLIC_USER_ID=client1

# Optional: Custom domain
CUSTOM_DOMAIN=client1.com
```

### For Claude Code (future)

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Testing

### Test Editor Deployment

```bash
curl -X POST http://localhost:3000/api/vercel/deploy-editor \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "githubOwner": "yourcompany",
    "githubRepo": "test-user-website",
    "githubToken": "ghp_xxxxx"
  }'
```

### Test Production Deployment

```bash
curl -X POST http://localhost:3000/api/vercel/deploy-production \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "githubOwner": "yourcompany",
    "githubRepo": "test-user-website",
    "githubToken": "ghp_xxxxx",
    "validateBuild": true,
    "autoFixErrors": true
  }'
```

---

## Next Steps

1. **Test API routes** - Make sure Vercel deployments work
2. **Update deployment modal** - Add new stages for validation and Vercel deployment
3. **Add loading states** - Show progress during multi-stage deployment
4. **Implement Claude Code** - Replace placeholder with actual build validation
5. **Add error handling** - Show clear error messages if deployment fails
6. **Test end-to-end** - Deploy a real site from editor to production

---

## Cost Estimates

### Per User Per Month

- **Vercel Hosting**: $0-20 (Free tier covers most, Pro if high traffic)
- **Claude Code API**: $0.02-0.12 (only runs during deployments)
- **Total**: ~$0-20/user/month

### Scale

- **10 users**: $0-200/month
- **100 users**: $0-2000/month
- **1000 users**: $0-20,000/month

Most users will stay on free tier, so actual costs likely much lower.
