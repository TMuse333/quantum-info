# SaaS Deployment Workflow - Editor Template Setup

## Overview
This document outlines the workflow for setting up the editor template and automating user deployments through the parent SaaS app.

---

## Current State
- **Current Branch:** `experiment` (your development/testing branch)
- **Goal:** Create a clean template on `development` branch that can be deployed for users

---

## Phase 1: Template Preparation (Next.js Editor Repo)

### 1.1 Duplicate Codebase to Development Branch
```bash
# From experiment branch
git checkout -b development

# Optional: Clean up any experiment-specific code
# (Review and remove any test data, debug code, etc.)

git push origin development
```

### 1.2 Clear Template Data
Create a clean slate for new users by clearing:

**Files to Reset:**
- [ ] `src/data/websiteData.json` - Reset to minimal template structure
- [ ] `src/data/*.data.ts` - Remove or use placeholder data
- [ ] `frontend/production-snapshots/` - Clear all snapshot files
- [ ] Any user-specific images in blob storage references

**Create `src/data/websiteData.template.json`:**
```json
{
  "templateName": "default",
  "websiteName": "My Website",
  "status": "draft",
  "currentVersionNumber": 0,
  "pages": {
    "index": {
      "pageName": "Home",
      "slug": "",
      "components": []
    }
  },
  "deployment": {
    "githubOwner": "",
    "githubRepo": "",
    "vercelProjectId": "",
    "vercelProductionUrl": "",
    "lastDeploymentStatus": "pending"
  },
  "formData": {},
  "createdAt": "",
  "updatedAt": ""
}
```

**Script to Reset Data (`scripts/reset-template-data.js`):**
```javascript
const fs = require('fs');
const path = require('path');

// Reset websiteData.json to template
const templatePath = path.join(__dirname, '../src/data/websiteData.template.json');
const dataPath = path.join(__dirname, '../src/data/websiteData.json');

const template = require(templatePath);
template.createdAt = new Date().toISOString();
template.updatedAt = new Date().toISOString();

fs.writeFileSync(dataPath, JSON.stringify(template, null, 2));
console.log('✅ Template data reset');

// Clear production snapshots
const snapshotsDir = path.join(__dirname, '../frontend/production-snapshots');
if (fs.existsSync(snapshotsDir)) {
  fs.rmSync(snapshotsDir, { recursive: true, force: true });
  fs.mkdirSync(snapshotsDir);
  console.log('✅ Snapshots cleared');
}
```

### 1.3 Create Template README
Add `TEMPLATE_SETUP.md` with instructions for the parent app:
```markdown
# Editor Template - Automated Setup

This is a template repository. Do not modify directly.

## Parent App Integration
See SAAS_DEPLOYMENT_WORKFLOW.md for setup instructions.

## Required Environment Variables (Set by Parent App)
- GITHUB_TOKEN
- VERCEL_TOKEN
- NEXT_PUBLIC_USER_ID
- Database credentials
```

---

## Phase 2: Parent App - GitHub API Integration

### 2.1 Setup GitHub API in Parent App

**Install Dependencies:**
```bash
npm install @octokit/rest
```

**Create GitHub Service (`services/github-template-service.ts`):**
```typescript
import { Octokit } from '@octokit/rest';

const TEMPLATE_REPO_OWNER = 'TMuse333'; // Your GitHub username
const TEMPLATE_REPO_NAME = 'next-js-template';
const TEMPLATE_BRANCH = 'development';

export async function createUserEditorRepo(
  userId: string,
  userData: {
    templateName: string;
    websiteName: string;
    selectedComponents: string[];
    colorTheme?: any;
  }
) {
  const octokit = new Octokit({
    auth: process.env.GITHUB_ADMIN_TOKEN
  });

  const newRepoName = `${userData.websiteName.toLowerCase().replace(/\s+/g, '-')}-${userId}`;

  // Step 1: Create new repo from template
  const { data: newRepo } = await octokit.repos.createUsingTemplate({
    template_owner: TEMPLATE_REPO_OWNER,
    template_repo: TEMPLATE_REPO_NAME,
    owner: TEMPLATE_REPO_OWNER, // or user's GitHub if they connected
    name: newRepoName,
    description: `Website editor for ${userData.websiteName}`,
    private: false, // Set to true for private repos
  });

  console.log(`✅ Created repo: ${newRepo.html_url}`);

  // Step 2: Update websiteData.json with user's data
  await updateWebsiteData(octokit, newRepoName, userId, userData);

  return {
    repoUrl: newRepo.html_url,
    repoName: newRepoName,
    cloneUrl: newRepo.clone_url,
  };
}

async function updateWebsiteData(
  octokit: Octokit,
  repoName: string,
  userId: string,
  userData: any
) {
  // Get current websiteData.json from development branch
  const { data: file } = await octokit.repos.getContent({
    owner: TEMPLATE_REPO_OWNER,
    repo: repoName,
    path: 'src/data/websiteData.json',
    ref: TEMPLATE_BRANCH,
  });

  // Decode and parse
  const content = Buffer.from(file.content, 'base64').toString('utf-8');
  const websiteData = JSON.parse(content);

  // Inject user data
  websiteData.templateName = userData.templateName;
  websiteData.websiteName = userData.websiteName;
  websiteData.ownerId = userId;
  websiteData.createdAt = new Date().toISOString();
  websiteData.updatedAt = new Date().toISOString();

  // Add user's selected components
  if (userData.selectedComponents?.length > 0) {
    websiteData.pages.index.components = userData.selectedComponents.map((type, idx) => ({
      id: `component-${idx}`,
      type,
      order: idx,
      props: {}, // Default props
    }));
  }

  // Commit updated data
  await octokit.repos.createOrUpdateFileContents({
    owner: TEMPLATE_REPO_OWNER,
    repo: repoName,
    path: 'src/data/websiteData.json',
    message: `Initialize website data for ${userData.websiteName}`,
    content: Buffer.from(JSON.stringify(websiteData, null, 2)).toString('base64'),
    sha: file.sha,
    branch: TEMPLATE_BRANCH,
  });

  console.log(`✅ Updated websiteData.json`);
}
```

---

## Phase 3: Parent App - Vercel API Integration

### 3.1 Setup Vercel API

**Install Vercel SDK:**
```bash
npm install @vercel/sdk
```

**Get Vercel Token:**
1. Go to https://vercel.com/account/tokens
2. Create new token: "Parent App - User Deployments"
3. Add to `.env`: `VERCEL_TOKEN=your_token_here`

**Create Vercel Service (`services/vercel-deployment-service.ts`):**
```typescript
import { Vercel } from '@vercel/sdk';

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN!,
});

export async function deployUserEditor(
  repoName: string,
  githubUrl: string,
  userData: {
    websiteName: string;
    userId: string;
  }
) {
  // Step 1: Create Vercel project
  const project = await vercel.projects.createProject({
    name: repoName,
    framework: 'nextjs',
    gitRepository: {
      type: 'github',
      repo: `TMuse333/${repoName}`,
    },
    environmentVariables: [
      {
        key: 'NEXT_PUBLIC_USER_ID',
        value: userData.userId,
        target: ['production', 'preview'],
      },
      {
        key: 'GITHUB_TOKEN',
        value: process.env.GITHUB_ADMIN_TOKEN!,
        target: ['production'],
        type: 'encrypted',
      },
      // Add database credentials
      {
        key: 'MONGODB_URI',
        value: process.env.MONGODB_URI!,
        target: ['production'],
        type: 'encrypted',
      },
    ],
  });

  console.log(`✅ Created Vercel project: ${project.name}`);

  // Step 2: Trigger initial deployment
  const deployment = await vercel.deployments.createDeployment({
    name: repoName,
    gitSource: {
      type: 'github',
      repo: `TMuse333/${repoName}`,
      ref: 'development',
    },
    target: 'production',
  });

  console.log(`✅ Deployment started: ${deployment.url}`);

  return {
    projectId: project.id,
    deploymentUrl: `https://${deployment.url}`,
    deploymentId: deployment.id,
  };
}

export async function getDeploymentStatus(deploymentId: string) {
  const deployment = await vercel.deployments.getDeployment({
    idOrUrl: deploymentId,
  });

  return {
    status: deployment.readyState,
    url: deployment.url,
    error: deployment.error,
  };
}
```

---

## Phase 4: Parent App - Complete User Onboarding Flow

### 4.1 User Signup/Editor Creation API

**Create API Route (`app/api/users/create-editor/route.ts`):**
```typescript
import { createUserEditorRepo } from '@/services/github-template-service';
import { deployUserEditor } from '@/services/vercel-deployment-service';

export async function POST(request: Request) {
  const body = await request.json();
  const {
    userId,
    templateName,
    websiteName,
    selectedComponents,
    colorTheme,
  } = body;

  try {
    // Step 1: Create GitHub repo from template
    console.log('📦 Creating GitHub repository...');
    const { repoUrl, repoName } = await createUserEditorRepo(userId, {
      templateName,
      websiteName,
      selectedComponents,
      colorTheme,
    });

    // Step 2: Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    const { projectId, deploymentUrl, deploymentId } = await deployUserEditor(
      repoName,
      repoUrl,
      { websiteName, userId }
    );

    // Step 3: Save to database
    await prisma.userEditor.create({
      data: {
        userId,
        repoUrl,
        repoName,
        deploymentUrl,
        vercelProjectId: projectId,
        status: 'deploying',
        createdAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      editorUrl: deploymentUrl,
      repoUrl,
      deploymentId,
    });
  } catch (error) {
    console.error('❌ Editor creation failed:', error);
    return Response.json(
      { error: 'Failed to create editor' },
      { status: 500 }
    );
  }
}
```

### 4.2 Monitor Deployment Status

**Create Polling API (`app/api/users/deployment-status/route.ts`):**
```typescript
import { getDeploymentStatus } from '@/services/vercel-deployment-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deploymentId = searchParams.get('deploymentId');

  const status = await getDeploymentStatus(deploymentId!);

  return Response.json(status);
}
```

---

## Phase 5: Testing Workflow

### 5.1 End-to-End Test Checklist

- [ ] **Template Setup**
  - [ ] Development branch has clean template data
  - [ ] No user-specific data in template
  - [ ] All dependencies installed
  - [ ] Build passes (`npm run build`)

- [ ] **GitHub Integration**
  - [ ] Can create new repo from template
  - [ ] Can update websiteData.json with user data
  - [ ] Repo is accessible and cloneable

- [ ] **Vercel Integration**
  - [ ] Can create Vercel project
  - [ ] Environment variables set correctly
  - [ ] Deployment succeeds
  - [ ] Editor loads at deployment URL

- [ ] **User Flow**
  - [ ] User selects template
  - [ ] User customizes (name, components, colors)
  - [ ] Click "Create My Editor"
  - [ ] GitHub repo created
  - [ ] Vercel deployment starts
  - [ ] User redirected to live editor
  - [ ] User can edit and deploy their site

---

## Phase 6: Production Deployment Strategy

### 6.1 Branch Strategy
```
main              (stable production code)
  ├── development (clean template for users)
  └── experiment  (your testing/development)
```

### 6.2 Deployment Pipeline
```
User Request
    ↓
Create Repo (from development branch)
    ↓
Inject User Data (websiteData.json)
    ↓
Deploy to Vercel (development branch)
    ↓
User Gets Live Editor
    ↓
User Edits & Deploys Their Site
```

---

## Environment Variables Needed

### Parent App (.env)
```bash
# GitHub
GITHUB_ADMIN_TOKEN=ghp_xxx  # Personal access token with repo permissions

# Vercel
VERCEL_TOKEN=xxx            # Vercel API token

# Database
MONGODB_URI=xxx             # Shared database for all users

# App Config
TEMPLATE_REPO_OWNER=TMuse333
TEMPLATE_REPO_NAME=next-js-template
TEMPLATE_BRANCH=development
```

### Template Repo (.env.template)
```bash
# Set by parent app during deployment
GITHUB_TOKEN=
VERCEL_TOKEN=
NEXT_PUBLIC_USER_ID=
MONGODB_URI=
```

---

## Cost Considerations

### Vercel Free Tier Limits
- **Free Projects:** 1 personal account
- **Deployments:** Unlimited
- **Bandwidth:** 100GB/month
- **Build Minutes:** 100 hours/month

### GitHub Free Tier
- **Public Repos:** Unlimited
- **Private Repos:** Unlimited
- **Actions Minutes:** 2000/month

### Scaling Strategy
- Start with Vercel Pro ($20/month) for parent app
- Each user gets their own free Vercel deployment
- Or: Batch users under your Pro account

---

## Security Checklist

- [ ] Template repo has no sensitive data
- [ ] Environment variables encrypted in Vercel
- [ ] GitHub tokens have minimal required permissions
- [ ] User data validated before injection
- [ ] Rate limiting on editor creation API
- [ ] User authentication required

---

## Troubleshooting

### Common Issues

**1. "Template not found"**
- Ensure development branch is pushed to GitHub
- Check TEMPLATE_BRANCH variable

**2. "Vercel deployment fails"**
- Check environment variables are set
- Verify GitHub repo is accessible
- Check Vercel project limits

**3. "websiteData.json not updated"**
- Check GitHub token permissions
- Verify file path is correct
- Check branch name matches

---

## Next Steps

1. [ ] Finalize template on development branch
2. [ ] Test manual repo creation from template
3. [ ] Implement GitHub service in parent app
4. [ ] Implement Vercel service in parent app
5. [ ] Create user onboarding UI
6. [ ] Test end-to-end flow
7. [ ] Deploy parent app to production
8. [ ] Monitor first user signups

---

## Resources

- [GitHub Template Repos Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
- [Vercel API Reference](https://vercel.com/docs/rest-api)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [@vercel/sdk Docs](https://www.npmjs.com/package/@vercel/sdk)

---

**Last Updated:** 2024-12-26
**Status:** Ready for Implementation
