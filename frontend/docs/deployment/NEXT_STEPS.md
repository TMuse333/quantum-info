# Next Steps for Vercel Integration

Clear action plan for completing the Vercel deployment integration.

---

## 🎯 Current Situation

**This Repo (Editor Template)**:
- ✅ Vercel API integration built
- ✅ Dry run mode working
- ⏳ Not yet tested with real Vercel deployment
- ⏳ Not yet integrated into UI
- ⏳ `npm run build` might fail on production branch (needs testing)

**Parent App (User Signup/Onboarding)**:
- ✅ Creates GitHub repo instance for each user
- ❌ Does NOT deploy editor to Vercel
- ❌ Does NOT deploy production to Vercel
- ⏳ Needs integration (see `PARENT_APP_INTEGRATION.md`)

---

## 📋 Action Steps for THIS Repo

### Step 1: Verify Production Build Works ⚠️

**Why**: Before deploying to Vercel, we need to ensure `npm run build` succeeds on the production branch.

```bash
# 1. Make sure you're on production/main branch
git checkout main  # or production, whichever you use

# 2. Install dependencies
npm install

# 3. Run build
npm run build

# Expected: Should complete without errors
# If errors occur: Fix them before proceeding
```

**Common Issues**:
- Missing environment variables
- TypeScript errors in production-specific code
- ESLint errors
- Missing dependencies

**Fix**: Make sure production branch has:
- All required env vars in `.env.example`
- No TypeScript errors
- All dependencies in `package.json`

---

### Step 2: Test Real Vercel Deployment (Production Branch Only)

**Why**: Verify that deploying the production branch to Vercel actually works.

```bash
# Make sure you're on production/main branch
git checkout main

# Test deployment with REAL Vercel API (not dry run)
curl -X POST http://localhost:3000/api/vercel/deploy-production \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "githubOwner": "TMuse333",
    "githubRepo": "next-js-template",
    "githubToken": "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",
    "validateBuild": false,
    "autoFixErrors": false,
    "dryRun": false
  }'
```

**Expected**:
- Vercel project created: `test-user-production`
- Deployment triggered
- After 2-5 minutes, site is live at `https://test-user-production.vercel.app`

**Check**:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Verify project `test-user-production` was created
3. Check deployment status
4. Visit the live URL when ready

**If it works**: Proceed to Step 3
**If it fails**: Check error logs, verify Vercel token, ensure build works locally

---

### Step 3: Integrate Vercel Deployment into UI

**Why**: Users need a way to trigger Vercel deployment from the editor.

**Option A: Add to Existing Deploy Modal** (Recommended)

Update `src/components/deployment/AnimatedDeployModal.tsx`:

```typescript
// Add Vercel deployment stages
const deploymentStages = [
  { id: 'saving', label: 'Auto-saving changes', icon: '💾' },
  { id: 'github', label: 'Pushing to GitHub', icon: '📁' },
  { id: 'validate', label: 'Validating build', icon: '🔍' }, // NEW
  { id: 'vercel', label: 'Deploying to Vercel', icon: '🚀' }, // NEW
  { id: 'complete', label: 'Live on Vercel!', icon: '✅' },
];

// Add Vercel deployment call after GitHub
async function handleDeploy() {
  try {
    // Stage 1: Auto-save
    setCurrentStage('saving');
    if (hasUnsavedChanges) {
      await saveToGitHub();
    }

    // Stage 2: Push to GitHub (existing)
    setCurrentStage('github');
    await fetch('/api/production/deploy-github', { ... });

    // Stage 3: Validate build (Claude Code placeholder)
    setCurrentStage('validate');
    await new Promise(r => setTimeout(r, 1000)); // Simulate for now

    // Stage 4: Deploy to Vercel (NEW!)
    setCurrentStage('vercel');
    const vercelResponse = await fetch('/api/vercel/deploy-production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: process.env.NEXT_PUBLIC_USER_ID || 'user',
        githubOwner: process.env.GITHUB_USERNAME || 'TMuse333',
        githubRepo: process.env.GITHUB_REPO || 'repo',
        githubToken: process.env.GITHUB_TOKEN,
        validateBuild: true,
        autoFixErrors: true,
        dryRun: false, // Real deployment!
      }),
    });

    const vercelResult = await vercelResponse.json();

    if (!vercelResult.success) {
      setError(vercelResult.error);
      return;
    }

    // Stage 5: Complete!
    setCurrentStage('complete');
    setProductionUrl(vercelResult.productionUrl);
    setDeploymentUrl(vercelResult.vercelUrl);

  } catch (error) {
    setError(error.message);
  }
}
```

**Option B: Add Separate "Deploy to Vercel" Button**

Add a new button in the deploy panel:
```tsx
<button onClick={handleDeployToVercel}>
  🚀 Deploy to Vercel
</button>
```

---

### Step 4: Add Environment Variable for GitHub Repo Name

**Why**: The editor needs to know which GitHub repo it's in.

Add to `.env`:
```env
GITHUB_REPO=next-js-template  # or dynamic per user
```

Update `.env.example`:
```env
# GitHub Repository
GITHUB_REPO=your-repo-name

# Vercel (for production deployment)
VERCEL_API_TOKEN=your_vercel_token
```

---

### Step 5: Test End-to-End Flow

**Full test from editor**:

1. Make a change in the editor
2. Click "Deploy to Production"
3. Watch the modal progress through stages:
   - Auto-saving changes ✅
   - Pushing to GitHub ✅
   - Validating build ✅
   - Deploying to Vercel ✅
   - Complete! ✅
4. Visit the Vercel URL
5. Verify changes are live

**Expected result**: Your changes appear on the live Vercel site within 2-5 minutes

---

### Step 6: Handle Build Validation (Optional, Future)

**When Claude Code is ready**, implement the `validateAndFixBuild()` function in `deploy-production.ts`:

```typescript
// Currently a placeholder that always returns success
// Future: Actually run npm build and fix errors
async function validateAndFixBuild(params) {
  // 1. Clone repo
  // 2. Run npm run build
  // 3. If fails, parse errors
  // 4. Call Claude Code API to fix
  // 5. Commit fixes
  // 6. Retry build
  return { passed: true };
}
```

For now, you can skip this and just deploy without validation.

---

### Step 7: Clean Up Test Deployments

After testing, delete the test Vercel project:

```bash
# Go to vercel.com/dashboard
# Find project: test-user-production
# Settings → Delete Project
```

---

## 🎯 Priority Order

**Do these first** (critical path):
1. ✅ Verify production build works (`npm run build`)
2. ✅ Test real Vercel deployment (API route with `dryRun: false`)
3. ✅ Integrate into deployment modal UI
4. ✅ Test end-to-end from editor

**Do these later** (nice to have):
5. ⏳ Add build validation with Claude Code
6. ⏳ Add deployment history tracking
7. ⏳ Add custom domain management UI

---

## 🚨 Important Notes

### This Repo's Responsibility

**What this repo handles**:
- ✅ Deploying **production branch** to Vercel when user clicks "Deploy"
- ✅ Running build validation (placeholder for now)
- ✅ Showing deployment progress in modal
- ✅ Handling deployment errors

**What this repo does NOT handle**:
- ❌ Creating the initial Vercel project for the editor (development branch)
- ❌ User onboarding flow
- ❌ Creating GitHub repos
- ❌ Multi-tenant user management

### Parent App's Responsibility

**What parent app handles**:
- ✅ User signup/onboarding
- ✅ Creating GitHub repo for each user
- ✅ Deploying **development branch** (editor) to Vercel ONCE
- ✅ Giving user the editor URL

See `PARENT_APP_INTEGRATION.md` for details on what the parent app needs to do.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PARENT APP                              │
│  (User Signup & Onboarding)                                  │
│                                                              │
│  1. User signs up                                            │
│  2. Create GitHub repo from template                         │
│  3. Deploy development branch → Vercel (editor)              │
│  4. Give user editor URL                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              THIS REPO (Editor Instance)                     │
│         Running on: user123-editor.vercel.app                │
│                                                              │
│  User works in editor:                                       │
│  - Edits components                                          │
│  - Customizes design                                         │
│  - Clicks "Deploy to Production"                             │
│                                                              │
│  Deployment flow:                                            │
│  1. Auto-save to GitHub (main branch)                        │
│  2. Validate build (optional)                                │
│  3. Deploy main branch → Vercel (production)                 │
│  4. User's site is live!                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              VERCEL PRODUCTION SITE                          │
│         Running on: user123.com or user123-prod.vercel.app   │
│                                                              │
│  - Live website that public sees                             │
│  - Updates when user clicks "Deploy"                         │
│  - Served from main/production branch                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

You're done when:

- [ ] `npm run build` works on production branch without errors
- [ ] Real Vercel deployment succeeds (not dry run)
- [ ] Deployment modal shows all stages (including Vercel)
- [ ] End-to-end test: change → deploy → live on Vercel
- [ ] Test deployment visible in Vercel dashboard
- [ ] Live URL is accessible and shows changes
- [ ] Parent app documentation complete

---

## 🆘 Troubleshooting

### Build fails on production branch
**Fix**: Run `npm run build` locally, fix TypeScript/ESLint errors

### Vercel deployment fails with 401
**Fix**: Check `VERCEL_API_TOKEN` is valid and has correct permissions

### Deployment succeeds but site shows 404
**Fix**: Verify build output directory is `.next`, check Vercel build logs

### Modal doesn't show Vercel stage
**Fix**: Make sure you integrated Vercel API call in modal component

---

**Next**: Start with Step 1 (verify production build works)
