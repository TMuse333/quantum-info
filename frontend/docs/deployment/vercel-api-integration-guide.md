# Vercel API Integration Guide

**Purpose:** Deploy development editor and production websites via Vercel API
**Status:** Implementation Guide
**Date:** 2025-12-23

---

## Overview

### What You Need to Deploy

**Two separate Vercel projects per user:**

1. **Development Editor** (`client-dev.yourcompany.com`)
   - This app (the editor)
   - Deployed once during user onboarding
   - Runs on `development` branch
   - Users edit their sites here

2. **Production Website** (`client.com`)
   - Generated output only (no editor)
   - Deployed every time user clicks "Deploy to Production"
   - Runs on `production` branch
   - Public-facing user's website

---

## Architecture: Where Code Lives

### Option A: Single Repo, Two Projects (RECOMMENDED)

```
github.com/yourcompany/client1-website
├── development branch (editor + content)
│   ├── src/app/              # Full editor app
│   ├── src/components/       # Editor components
│   ├── src/stores/          # Zustand stores
│   └── src/data/websiteData.json
│
└── production branch (content only)
    ├── app/                 # Minimal Next.js app
    ├── components/          # ONLY user-facing components
    ├── data/websiteData.json
    └── No editor code!

Vercel Projects:
  1. "client1-editor" → development branch → client1-dev.yourcompany.com
  2. "client1-site" → production branch → client1.com
```

**Why this works:**
- ✅ One repo to manage
- ✅ Git history shared
- ✅ Easy to sync content between branches
- ✅ Editor changes don't affect production
- ✅ Production is lightweight (faster builds)

---

### Option B: Parent App + User Repos (Alternative)

```
Parent Repo (template):
  github.com/yourcompany/editor-template
  - Full editor application
  - Shared across all users
  - Deployed as: user-dev.yourcompany.com

User Repos:
  github.com/yourcompany/client1-website
  - Content only (websiteData.json)
  - No editor code
  - Deployed as: client1.com
```

**Why you might NOT want this:**
- ❌ Parent app can't access user repos easily
- ❌ More complex to manage
- ❌ Harder to customize per user
- ⚠️ Only works if ALL users share identical editor

**Verdict:** Stick with Option A

---

## Step-by-Step: Vercel API Setup

### 1. Install Dependencies

```bash
npm install @vercel/client
npm install -D @types/node
```

### 2. Get Vercel API Token

1. Go to https://vercel.com/account/tokens
2. Create new token: "Website Builder API"
3. Copy token → Save to `.env`:
   ```env
   VERCEL_TOKEN=your_token_here
   ```

### 3. Create Vercel Client Wrapper

**File:** `src/lib/vercel/vercel-client.ts`

```typescript
import { VercelClient } from '@vercel/client';

// Singleton instance
let vercelClient: VercelClient | null = null;

export function getVercelClient() {
  if (!vercelClient) {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      throw new Error('VERCEL_TOKEN not set');
    }
    vercelClient = new VercelClient({ token });
  }
  return vercelClient;
}

// Helper types
export interface VercelProject {
  id: string;
  name: string;
  framework: 'nextjs';
  gitRepository: {
    type: 'github';
    repo: string;
    branch: string;
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  readyState: 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED';
  createdAt: number;
  buildingAt?: number;
  readyAt?: number;
}
```

---

## Deployment: Development Editor (One-Time Setup)

### When to Run This
- During user onboarding
- Only runs ONCE per user
- Creates permanent editor instance

### Implementation

**File:** `src/lib/vercel/deploy-editor.ts`

```typescript
import { getVercelClient } from './vercel-client';

export interface DeployEditorParams {
  userId: string;
  githubOwner: string;
  githubRepo: string;
  githubToken: string;
}

export async function deployEditor({
  userId,
  githubOwner,
  githubRepo,
  githubToken
}: DeployEditorParams) {
  console.log(`🚀 [VERCEL] Deploying editor for user: ${userId}`);

  const vercel = getVercelClient();
  const projectName = `${userId}-editor`;

  try {
    // 1. Create Vercel project
    console.log('📦 [VERCEL] Creating project...');
    const project = await vercel.createProject({
      name: projectName,
      framework: 'nextjs',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm install',
      devCommand: 'npm run dev',
      environmentVariables: [
        {
          type: 'encrypted',
          key: 'GITHUB_TOKEN',
          value: githubToken,
          target: ['production', 'preview']
        },
        {
          type: 'plain',
          key: 'GITHUB_OWNER',
          value: githubOwner,
          target: ['production', 'preview']
        },
        {
          type: 'plain',
          key: 'GITHUB_REPO',
          value: githubRepo,
          target: ['production', 'preview']
        },
        {
          type: 'plain',
          key: 'NEXT_PUBLIC_USER_ID',
          value: userId,
          target: ['production', 'preview']
        },
        {
          type: 'plain',
          key: 'NEXT_PUBLIC_REPO_TYPE',
          value: 'monorepo',
          target: ['production', 'preview']
        }
      ],
      gitRepository: {
        type: 'github',
        repo: `${githubOwner}/${githubRepo}`,
        branch: 'development' // Editor runs on development branch
      }
    });

    console.log(`✅ [VERCEL] Project created: ${project.id}`);

    // 2. Trigger initial deployment
    console.log('🔨 [VERCEL] Triggering initial deployment...');
    const deployment = await vercel.createDeployment({
      name: projectName,
      project: project.id,
      target: 'production', // This is "production" environment of dev editor
      gitSource: {
        type: 'github',
        ref: 'development',
        repoId: project.gitRepository.repoId
      }
    });

    console.log(`🔨 [VERCEL] Deployment started: ${deployment.id}`);

    // 3. Wait for deployment to complete (or timeout after 5 min)
    const result = await waitForDeployment(deployment.id, 300000);

    if (result.readyState !== 'READY') {
      throw new Error(`Deployment failed with state: ${result.readyState}`);
    }

    console.log(`✅ [VERCEL] Deployment ready: ${result.url}`);

    // 4. Assign custom domain
    const customDomain = `${userId}-dev.yourcompany.com`;
    console.log(`🌐 [VERCEL] Assigning domain: ${customDomain}`);

    await vercel.addDomain(project.id, {
      name: customDomain,
      gitBranch: 'development'
    });

    console.log(`✅ [VERCEL] Domain assigned: https://${customDomain}`);

    return {
      success: true,
      projectId: project.id,
      deploymentId: deployment.id,
      editorUrl: `https://${customDomain}`,
      vercelUrl: result.url
    };

  } catch (error: any) {
    console.error('❌ [VERCEL] Editor deployment failed:', error);
    throw error;
  }
}

// Helper: Wait for deployment to finish
async function waitForDeployment(
  deploymentId: string,
  timeout: number = 300000
): Promise<VercelDeployment> {
  const vercel = getVercelClient();
  const startTime = Date.now();
  const pollInterval = 5000; // Check every 5 seconds

  while (Date.now() - startTime < timeout) {
    const deployment = await vercel.getDeployment(deploymentId);

    console.log(`⏳ [VERCEL] Deployment state: ${deployment.readyState}`);

    if (deployment.readyState === 'READY') {
      return deployment;
    }

    if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
      throw new Error(`Deployment ${deployment.readyState}`);
    }

    // Still building, wait and check again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Deployment timeout after 5 minutes');
}
```

---

## Deployment: Production Website (User-Triggered)

### When to Run This
- When user clicks "Deploy to Production"
- Runs every time user wants to publish changes
- Updates their public website

### Implementation

**File:** `src/lib/vercel/deploy-production.ts`

```typescript
import { getVercelClient } from './vercel-client';

export interface DeployProductionParams {
  userId: string;
  githubOwner: string;
  githubRepo: string;
  customDomain?: string; // e.g., "client.com"
  projectId?: string; // If already created
}

export async function deployProduction({
  userId,
  githubOwner,
  githubRepo,
  customDomain,
  projectId
}: DeployProductionParams) {
  console.log(`🚀 [VERCEL] Deploying production for user: ${userId}`);

  const vercel = getVercelClient();
  const projectName = `${userId}-site`;

  try {
    let project;

    // 1. Create project if it doesn't exist
    if (!projectId) {
      console.log('📦 [VERCEL] Creating production project...');
      project = await vercel.createProject({
        name: projectName,
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        environmentVariables: [
          {
            type: 'plain',
            key: 'NEXT_PUBLIC_USER_ID',
            value: userId,
            target: ['production']
          }
        ],
        gitRepository: {
          type: 'github',
          repo: `${githubOwner}/${githubRepo}`,
          branch: 'production' // Production site uses production branch
        }
      });
      projectId = project.id;
      console.log(`✅ [VERCEL] Production project created: ${projectId}`);
    }

    // 2. Trigger deployment
    console.log('🔨 [VERCEL] Triggering production deployment...');
    const deployment = await vercel.createDeployment({
      name: projectName,
      project: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
        ref: 'production',
        repoId: project?.gitRepository.repoId
      }
    });

    console.log(`🔨 [VERCEL] Deployment started: ${deployment.id}`);

    // 3. Wait for deployment (with progress tracking)
    const result = await waitForDeploymentWithProgress(deployment.id);

    if (result.readyState !== 'READY') {
      throw new Error(`Deployment failed with state: ${result.readyState}`);
    }

    console.log(`✅ [VERCEL] Production ready: ${result.url}`);

    // 4. Assign custom domain (if provided)
    if (customDomain) {
      console.log(`🌐 [VERCEL] Assigning custom domain: ${customDomain}`);
      await vercel.addDomain(projectId, {
        name: customDomain,
        gitBranch: 'production'
      });
      console.log(`✅ [VERCEL] Domain assigned: https://${customDomain}`);
    }

    return {
      success: true,
      projectId,
      deploymentId: deployment.id,
      productionUrl: customDomain ? `https://${customDomain}` : result.url,
      vercelUrl: result.url
    };

  } catch (error: any) {
    console.error('❌ [VERCEL] Production deployment failed:', error);
    throw error;
  }
}

// Helper: Wait with progress updates
async function waitForDeploymentWithProgress(
  deploymentId: string,
  onProgress?: (state: string, elapsed: number) => void
): Promise<VercelDeployment> {
  const vercel = getVercelClient();
  const startTime = Date.now();
  const pollInterval = 3000; // Check every 3 seconds
  const timeout = 600000; // 10 min timeout for production

  while (Date.now() - startTime < timeout) {
    const deployment = await vercel.getDeployment(deploymentId);
    const elapsed = Date.now() - startTime;

    // Call progress callback
    if (onProgress) {
      onProgress(deployment.readyState, elapsed);
    }

    console.log(`⏳ [VERCEL] ${deployment.readyState} (${Math.round(elapsed / 1000)}s)`);

    if (deployment.readyState === 'READY') {
      return deployment;
    }

    if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
      throw new Error(`Deployment ${deployment.readyState}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Deployment timeout after 10 minutes');
}
```

---

## API Routes: Exposing to Frontend

### 1. Deploy Editor (Admin Only)

**File:** `src/app/api/admin/vercel/deploy-editor/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deployEditor } from '@/lib/vercel/deploy-editor';

export async function POST(req: NextRequest) {
  try {
    const { userId, githubOwner, githubRepo, githubToken } = await req.json();

    // Validate admin auth
    const adminToken = req.headers.get('authorization');
    if (adminToken !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Deploy editor
    const result = await deployEditor({
      userId,
      githubOwner,
      githubRepo,
      githubToken
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Deploy editor error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 2. Deploy Production (User-Triggered)

**File:** `src/app/api/production/deploy-vercel/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deployProduction } from '@/lib/vercel/deploy-production';
import { validateBuild } from '@/lib/build/validate-build';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      githubOwner,
      githubRepo,
      customDomain,
      projectId,
      skipBuildValidation = false
    } = await req.json();

    // 1. Validate build first (unless skipped)
    if (!skipBuildValidation) {
      console.log('🧪 [API] Validating build...');
      const buildCheck = await validateBuild(userId);

      if (!buildCheck.success) {
        return NextResponse.json({
          error: 'Build validation failed',
          errors: buildCheck.errors
        }, { status: 400 });
      }
    }

    // 2. Deploy to Vercel
    console.log('🚀 [API] Deploying to Vercel...');
    const result = await deployProduction({
      userId,
      githubOwner,
      githubRepo,
      customDomain,
      projectId
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Deploy production error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Integrating with Current Deployment Flow

### Update `AnimatedDeployModal` to Use Vercel

**File:** `src/components/deployment/AnimatedDeployModal.tsx`

Add new stage after GitHub deployment:

```typescript
const STAGES: StageConfig[] = [
  // ... existing stages ...
  {
    id: 'vercel',
    name: 'Vercel Deployment',
    animation: VercelDeployAnimation, // You'll need to create this
    minDuration: 3000,
    entryDuration: 300,
    loopDuration: 1000,
    exitDuration: 200,
  },
];

// In your deployment function:
async function startDeployment() {
  // ... existing stages (validation, file gen, git, etc.) ...

  // After Git deployment succeeds:
  if (!dryRun) {
    // Stage: Vercel Deployment
    sendEvent('stage', { name: 'vercel', status: 'running' });

    try {
      const vercelResult = await fetch('/api/production/deploy-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: process.env.NEXT_PUBLIC_USER_ID,
          githubOwner: process.env.GITHUB_OWNER,
          githubRepo: process.env.GITHUB_REPO,
          customDomain: websiteData.customDomain,
          projectId: websiteData.vercelProjectId // Stored in websiteData
        })
      });

      if (!vercelResult.ok) {
        throw new Error('Vercel deployment failed');
      }

      const { productionUrl } = await vercelResult.json();
      sendEvent('stage', { name: 'vercel', status: 'complete' });
      sendEvent('complete', {
        productionUrl,
        success: true
      });

    } catch (error) {
      sendEvent('error', { message: error.message });
    }
  }
}
```

---

## Environment Variables You Need

### In This App (Editor)

```env
# Vercel API
VERCEL_TOKEN=your_vercel_api_token
VERCEL_TEAM_ID=your_vercel_team_id (optional)

# GitHub (for this user's repo)
GITHUB_TOKEN=user_specific_token
GITHUB_OWNER=yourcompany
GITHUB_REPO=client1-website
NEXT_PUBLIC_REPO_TYPE=monorepo

# User Info
NEXT_PUBLIC_USER_ID=client1

# Admin (for deploying editors)
ADMIN_SECRET=your_admin_secret
```

### In Parent/Admin App (If Separate)

```env
# Vercel API
VERCEL_TOKEN=your_vercel_api_token

# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY=your_private_key

# Admin
ADMIN_SECRET=your_admin_secret

# Database (for user management)
DATABASE_URL=postgresql://...
```

---

## Cost Breakdown

### Vercel Pricing (as of 2025)

**Free Tier (per project):**
- 100GB bandwidth/month
- 6000 build minutes/month
- Unlimited deployments

**Pro Tier ($20/month per project):**
- 1TB bandwidth
- Unlimited build minutes
- Better performance

**For your use case:**
- Development editor: Free tier (low traffic)
- Production sites: Free tier → Pro as they grow
- **Estimate:** $0-20/user/month depending on traffic

---

## Testing Plan

### 1. Test Editor Deployment

```typescript
// test-editor-deploy.ts
import { deployEditor } from '@/lib/vercel/deploy-editor';

async function testEditorDeploy() {
  const result = await deployEditor({
    userId: 'test-user-1',
    githubOwner: 'yourcompany',
    githubRepo: 'test-user-1-website',
    githubToken: 'ghp_test_token_here'
  });

  console.log('Editor deployed:', result.editorUrl);
  // Visit the URL and test that editor loads
}
```

### 2. Test Production Deployment

```typescript
// test-production-deploy.ts
import { deployProduction } from '@/lib/vercel/deploy-production';

async function testProductionDeploy() {
  const result = await deployProduction({
    userId: 'test-user-1',
    githubOwner: 'yourcompany',
    githubRepo: 'test-user-1-website',
    customDomain: 'test-user-1.yourcompany.com'
  });

  console.log('Production deployed:', result.productionUrl);
  // Visit the URL and test that site loads
}
```

---

## Common Issues & Solutions

### Issue: "Project already exists"
**Solution:** Store `projectId` in user's database, reuse it

### Issue: "Domain already assigned"
**Solution:** Check if domain exists before adding

### Issue: "Build failed on Vercel"
**Solution:** Run build validation before deploying (covered in next doc)

### Issue: "Deployment timeout"
**Solution:** Increase timeout, check build logs on Vercel dashboard

---

## Next Steps

1. ✅ Install `@vercel/client`
2. ✅ Get Vercel API token
3. ✅ Implement `deployEditor()` function
4. ✅ Implement `deployProduction()` function
5. ✅ Add API routes
6. ✅ Update deployment modal
7. ✅ Test with test user
8. ✅ See build validation doc for ensuring builds work

---

**Summary:** You need Vercel API in THIS app to deploy both dev editor and production sites. Two separate Vercel projects per user, both deploying from the same GitHub repo but different branches.
