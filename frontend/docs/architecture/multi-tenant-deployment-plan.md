# Multi-Tenant Deployment Architecture Plan

**Status:** Planning Phase
**Date:** 2025-12-23
**Decision Required:** Individual Repos vs Shared Multi-Tenant

---

## Current State

### What Works:
- ✅ Editor loads/saves to GitHub
- ✅ Auto-save before deployment
- ✅ Production snapshots for version history
- ✅ Deployment modal with progress tracking
- ✅ Component-based website builder

### What's Missing:
- ❌ Multi-user support
- ❌ Automated build validation
- ❌ Production deployment via Vercel API
- ❌ Error recovery with Claude Code API
- ❌ Per-user domain management

---

## Architecture Decision: Individual Repos vs Shared

### Option A: Individual Repos Per User (RECOMMENDED)

**Structure:**
```
User 1:
  Repo: github.com/yourcompany/client1-website
  Dev Editor: client1-dev.yourcompany.com
  Production: client1.com

User 2:
  Repo: github.com/yourcompany/client2-website
  Dev Editor: client2-dev.yourcompany.com
  Production: client2.com
```

**Pros:**
- ✅ **Complete isolation** - Users can't break each other's sites
- ✅ **Simpler security** - GitHub repo permissions = user permissions
- ✅ **Custom domains easy** - Each user has their own Vercel project
- ✅ **Git history per user** - Clean version control
- ✅ **Scale independently** - Each user's site can grow without affecting others
- ✅ **Easy backup/export** - User owns their repo
- ✅ **Vercel free tier per user** - Each gets their own quota
- ✅ **Simpler debugging** - Issues are isolated to one user

**Cons:**
- ❌ More repos to manage (automation needed)
- ❌ Template updates require propagation
- ❌ More Vercel projects to track
- ❌ Slightly higher infrastructure overhead

**Cost Analysis:**
- GitHub: Free for public repos, $4/month for private (per user)
- Vercel: Free tier per project (good for most users)
- Total: ~$4/user/month if private repos needed

---

### Option B: Shared Multi-Tenant (`editor.com/{userId}`)

**Structure:**
```
Single Repo: github.com/yourcompany/all-websites
  /users/user1/websiteData.json
  /users/user2/websiteData.json

Single Vercel: editor.yourcompany.com
  - editor.com/user1 (dev)
  - editor.com/user2 (dev)

Production: Separate Vercel projects per user
```

**Pros:**
- ✅ Easier template updates (one place)
- ✅ Shared infrastructure
- ✅ Centralized monitoring
- ✅ Single codebase to maintain

**Cons:**
- ❌ **Security complexity** - Need robust user isolation
- ❌ **Single point of failure** - One bug affects all users
- ❌ **Performance concerns** - All users share resources
- ❌ **Git conflicts** - Multiple users editing at once
- ❌ **Backup complexity** - Can't easily export one user
- ❌ **Scaling limits** - Vercel has project size limits
- ❌ **Domain management harder** - Need subdomain routing

---

## RECOMMENDATION: Individual Repos Per User

**Why:**
- Isolation is critical for a website builder product
- Simpler to reason about security
- GitHub + Vercel free tiers make it cost-effective
- Easier to sell "You own your code" value prop
- Industry standard (Webflow, Framer use similar approach)

---

## Implementation Plan

### Phase 1: Template Repository Setup (Week 1)

**Goal:** Create a master template that can be cloned for each user

**Tasks:**
1. **Create Template Repo**
   - Clean version of current repo
   - Remove user-specific data
   - Add setup scripts
   - Document required env vars

2. **Automation Scripts**
   ```bash
   scripts/
   ├── create-user-repo.sh      # Clone template for new user
   ├── setup-vercel-dev.sh      # Deploy dev editor
   ├── setup-vercel-prod.sh     # Deploy production site
   └── update-template.sh        # Propagate template updates
   ```

3. **Environment Variables Template**
   ```env
   # User-specific (generated per user)
   NEXT_PUBLIC_USER_ID=client1
   GITHUB_TOKEN=<user's token>
   GITHUB_OWNER=yourcompany
   GITHUB_REPO=client1-website

   # Shared (same for all users)
   NEXT_PUBLIC_CLAUDE_API_KEY=<your key>
   VERCEL_TOKEN=<your token>
   ```

**File:** `docs/setup/template-repo-structure.md`

---

### Phase 2: User Onboarding Flow (Week 2)

**Goal:** Automate user signup → repo creation → deployment

**Flow:**
```
1. User signs up on yourcompany.com
   ↓
2. Backend creates:
   - GitHub repo (from template)
   - Vercel dev project
   - Vercel production project
   - GitHub token for user
   ↓
3. Deploy dev editor to client-dev.yourcompany.com
   ↓
4. User receives email:
   - Link to dev editor
   - GitHub repo link
   - Setup instructions
   ↓
5. User builds site in editor
   ↓
6. User deploys → Production goes live
```

**Backend API Endpoints:**
```typescript
POST /api/admin/users/create
  - Creates user account
  - Returns user credentials

POST /api/admin/repos/create
  - Clones template repo for user
  - Sets up GitHub webhooks
  - Returns repo URL

POST /api/admin/vercel/deploy-dev
  - Deploys editor to Vercel
  - Returns dev URL

POST /api/admin/vercel/deploy-prod
  - Deploys production site
  - Returns production URL
```

**File:** `docs/setup/user-onboarding-flow.md`

---

### Phase 3: Vercel API Integration (Week 3)

**Goal:** Programmatically deploy to Vercel from editor

#### A. Development Editor Deployment

**When:** Once during user onboarding

**Process:**
```typescript
// scripts/deploy-editor.ts
import { VercelClient } from '@vercel/client';

async function deployEditor(userId: string) {
  const vercel = new VercelClient({ token: VERCEL_TOKEN });

  // 1. Create Vercel project
  const project = await vercel.createProject({
    name: `${userId}-editor`,
    framework: 'nextjs',
    gitRepository: {
      type: 'github',
      repo: `yourcompany/${userId}-website`,
      branch: 'development'
    },
    environmentVariables: [
      { key: 'GITHUB_TOKEN', value: userGithubToken },
      { key: 'NEXT_PUBLIC_USER_ID', value: userId }
    ]
  });

  // 2. Deploy
  const deployment = await vercel.createDeployment({
    name: `${userId}-editor`,
    project: project.id,
    target: 'production',
    gitSource: {
      type: 'github',
      ref: 'development',
      repoId: repoId
    }
  });

  // 3. Assign domain
  await vercel.addDomain(project.id, `${userId}-dev.yourcompany.com`);

  return {
    editorUrl: `https://${userId}-dev.yourcompany.com`,
    deploymentId: deployment.id
  };
}
```

#### B. Production Website Deployment

**When:** User clicks "Deploy to Production" in editor

**Process:**
```typescript
// src/app/api/production/deploy-vercel/route.ts
export async function POST(req: Request) {
  const { userId, websiteData } = await req.json();

  // 1. Run build validation first
  const buildCheck = await validateBuild(userId);
  if (!buildCheck.success) {
    // Trigger Claude Code to fix errors
    await fixBuildErrors(buildCheck.errors);

    // Re-validate
    const recheck = await validateBuild(userId);
    if (!recheck.success) {
      return Response.json({
        error: 'Build failed after auto-fix',
        errors: recheck.errors
      }, { status: 400 });
    }
  }

  // 2. Deploy to Vercel
  const vercel = new VercelClient({ token: VERCEL_TOKEN });

  const deployment = await vercel.createDeployment({
    name: `${userId}-production`,
    project: productionProjectId,
    target: 'production',
    gitSource: {
      type: 'github',
      ref: 'production',
      repoId: repoId
    }
  });

  // 3. Wait for deployment
  const result = await vercel.waitForDeployment(deployment.id);

  // 4. Assign custom domain (if configured)
  if (userCustomDomain) {
    await vercel.addDomain(productionProjectId, userCustomDomain);
  }

  return Response.json({
    success: true,
    url: result.url,
    deploymentId: deployment.id
  });
}
```

**File:** `docs/deployment/vercel-api-integration.md`

---

### Phase 4: Build Validation with Claude Code API (Week 4)

**Goal:** Autonomously fix build errors before deployment

#### A. Pre-Deployment Build Check

**Flow:**
```
User clicks "Deploy to Production"
  ↓
Auto-save changes to GitHub
  ↓
Trigger build validation
  ↓
┌─────────────────────────┬─────────────────────────┐
│ Build succeeds          │ Build fails             │
└─────────────────────────┴─────────────────────────┘
  ↓                               ↓
Deploy to Vercel          Claude Code Auto-Fix
                                  ↓
                          Re-run build
                                  ↓
                          ┌───────────────────────┬───────────┐
                          │ Fixed                 │ Still fails│
                          └───────────────────────┴───────────┘
                                  ↓                      ↓
                          Deploy to Vercel      Show errors to user
```

#### B. Build Validation Function

```typescript
// src/lib/build/validate-build.ts
export async function validateBuild(userId: string) {
  console.log('🔨 [BUILD] Running build validation...');

  // 1. Clone repo to temp directory
  const tmpDir = await cloneRepo(userId);

  // 2. Run npm install
  await exec('npm install', { cwd: tmpDir });

  // 3. Run build
  try {
    const { stdout, stderr } = await exec('npm run build', {
      cwd: tmpDir,
      timeout: 300000 // 5 min timeout
    });

    console.log('✅ [BUILD] Build succeeded');
    return {
      success: true,
      output: stdout
    };
  } catch (error: any) {
    console.error('❌ [BUILD] Build failed:', error.stderr);

    // Parse errors
    const errors = parseBuildErrors(error.stderr);

    return {
      success: false,
      errors,
      fullOutput: error.stderr
    };
  }
}

function parseBuildErrors(stderr: string): BuildError[] {
  const errors: BuildError[] = [];

  // TypeScript errors
  const tsErrors = stderr.match(/error TS\d+: .+/g);
  if (tsErrors) {
    errors.push(...tsErrors.map(err => ({
      type: 'typescript',
      message: err,
      severity: 'error'
    })));
  }

  // ESLint errors
  const eslintErrors = stderr.match(/\d+:\d+\s+error\s+.+/g);
  if (eslintErrors) {
    errors.push(...eslintErrors.map(err => ({
      type: 'eslint',
      message: err,
      severity: 'error'
    })));
  }

  // Syntax errors
  const syntaxErrors = stderr.match(/SyntaxError: .+/g);
  if (syntaxErrors) {
    errors.push(...syntaxErrors.map(err => ({
      type: 'syntax',
      message: err,
      severity: 'error'
    })));
  }

  return errors;
}
```

#### C. Claude Code Auto-Fix

```typescript
// src/lib/build/claude-auto-fix.ts
import Anthropic from '@anthropic-ai/sdk';

export async function fixBuildErrors(
  errors: BuildError[],
  userId: string
): Promise<{ success: boolean; fixes: FileFix[] }> {
  console.log('🤖 [CLAUDE] Starting autonomous error fixing...');

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // 1. Analyze errors
  const errorSummary = errors.map(e =>
    `[${e.type}] ${e.message}`
  ).join('\n');

  // 2. Get affected files
  const affectedFiles = extractFilesFromErrors(errors);
  const fileContents = await readFiles(userId, affectedFiles);

  // 3. Ask Claude to fix
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20251101',
    max_tokens: 8096,
    messages: [{
      role: 'user',
      content: `You are a Next.js build error fixer. Fix these build errors:

${errorSummary}

Here are the affected files:
${fileContents}

Return ONLY valid JSON with this structure:
{
  "fixes": [
    {
      "file": "path/to/file.tsx",
      "changes": [
        {
          "line": 42,
          "oldCode": "const foo = bar",
          "newCode": "const foo = bar as string",
          "reason": "Added type assertion to fix TS error"
        }
      ]
    }
  ]
}`
    }]
  });

  // 4. Parse Claude's response
  const response = JSON.parse(message.content[0].text);

  // 5. Apply fixes to GitHub
  for (const fix of response.fixes) {
    await applyFix(userId, fix);
  }

  console.log('✅ [CLAUDE] Applied', response.fixes.length, 'fixes');

  return {
    success: true,
    fixes: response.fixes
  };
}
```

**File:** `docs/deployment/claude-auto-fix.md`

---

### Phase 5: Production Deployment Guards (Week 5)

**Goal:** Ensure production deployments never break user sites

#### Test Suite Before Deploy

```typescript
// tests/pre-deployment.test.ts
export async function runPreDeploymentTests(userId: string) {
  const results = {
    build: false,
    typescript: false,
    eslint: false,
    lighthouse: false,
    links: false
  };

  // 1. Build test
  console.log('🧪 [TEST] Running build...');
  const buildResult = await validateBuild(userId);
  results.build = buildResult.success;

  if (!results.build) {
    return { success: false, results, errors: buildResult.errors };
  }

  // 2. TypeScript type check
  console.log('🧪 [TEST] Checking TypeScript...');
  const tscResult = await exec('npx tsc --noEmit');
  results.typescript = tscResult.exitCode === 0;

  // 3. ESLint
  console.log('🧪 [TEST] Running ESLint...');
  const eslintResult = await exec('npx eslint . --max-warnings 0');
  results.eslint = eslintResult.exitCode === 0;

  // 4. Lighthouse (performance)
  console.log('🧪 [TEST] Running Lighthouse...');
  const lighthouseScore = await runLighthouse(devUrl);
  results.lighthouse = lighthouseScore.performance > 80;

  // 5. Broken links check
  console.log('🧪 [TEST] Checking for broken links...');
  const linksResult = await checkBrokenLinks(devUrl);
  results.links = linksResult.brokenLinks.length === 0;

  return {
    success: Object.values(results).every(r => r === true),
    results,
    errors: []
  };
}
```

**File:** `docs/deployment/production-guards.md`

---

## Implementation Roadmap

### Week 1: Template & Infrastructure
- [ ] Clean up current repo as master template
- [ ] Create automation scripts (repo creation, Vercel setup)
- [ ] Document environment variables
- [ ] Test manual repo cloning process

### Week 2: User Onboarding
- [ ] Build admin backend API
- [ ] Create user signup flow
- [ ] Automate GitHub repo creation
- [ ] Automate Vercel project creation
- [ ] Test end-to-end onboarding

### Week 3: Vercel Integration
- [ ] Install Vercel SDK
- [ ] Build dev editor deployment
- [ ] Build production deployment
- [ ] Add domain management
- [ ] Test deployments

### Week 4: Build Validation
- [ ] Build validation function
- [ ] Error parsing
- [ ] Claude Code integration
- [ ] Auto-fix testing
- [ ] Fallback error reporting

### Week 5: Production Guards
- [ ] Pre-deployment test suite
- [ ] Lighthouse integration
- [ ] Link checker
- [ ] Deployment approval flow
- [ ] Rollback mechanism

---

## Technical Considerations

### Security
- [ ] GitHub token per user (not shared)
- [ ] Vercel API scoped to projects
- [ ] User can't access other users' repos
- [ ] Rate limiting on Claude API calls
- [ ] Validate all user inputs

### Performance
- [ ] Build validation timeout (5 min max)
- [ ] Claude API timeout (30 sec max)
- [ ] Queue deployments (don't run concurrently per user)
- [ ] Cache build results for repeated attempts

### Costs
- **GitHub:** $4/user/month (private repos)
- **Vercel:** Free tier + overages (~$20/month per 100GB)
- **Claude API:** ~$0.50-$2 per deployment with auto-fix
- **Infrastructure:** ~$50/month (backend server)
- **Total:** ~$4-6/user/month + $50 base

### Scaling
- **100 users:** ~$450-650/month
- **1000 users:** ~$4050-6050/month
- **10000 users:** ~$40,050-60,050/month

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude API fails to fix errors | High | Fallback to manual error display |
| Vercel API rate limits | Medium | Queue deployments, retry logic |
| Build takes too long | Medium | 5 min timeout, show progress |
| User's custom code breaks build | High | Sandbox validation before merge |
| GitHub API rate limits | Medium | Use app authentication (5000 req/hr) |
| Vercel costs spiral | High | Monitor usage, set project limits |

---

## Success Metrics

### MVP (First 10 Users)
- [ ] User can sign up and get editor in < 5 min
- [ ] Build validation catches 90%+ of errors
- [ ] Claude auto-fix solves 70%+ of build errors
- [ ] Production deployments succeed 95%+ of time
- [ ] Average deployment time < 3 minutes

### Scale (100 Users)
- [ ] Zero downtime for existing users during template updates
- [ ] Build validation runs in < 2 min average
- [ ] Auto-fix success rate > 80%
- [ ] User satisfaction > 4.5/5

---

## Next Immediate Steps

1. **Decision:** Approve individual repos architecture ✅
2. **Action:** Create clean template repo (Week 1)
3. **Action:** Build repo cloning script (Week 1)
4. **Action:** Test Vercel API integration (Week 1)
5. **Action:** Plan user onboarding backend (Week 2)

---

**Status:** Ready for implementation
**Estimated Timeline:** 5 weeks to MVP
**Blocker:** None - can start immediately

**Last Updated:** 2025-12-23
