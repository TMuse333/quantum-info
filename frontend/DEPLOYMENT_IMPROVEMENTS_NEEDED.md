# Deployment Improvements Needed

**Date:** 2026-01-01
**Status:** Planning

---

## 📋 Summary of Required Changes

Based on analysis of the parent repo (`../../easy-money`), the following improvements are needed:

1. **Environment Variables**: Pass `.env` vars to deployed projects via Vercel API
2. **Custom Domain**: Use `process.env.DOMAIN_NAME` instead of `vercel.app`
3. **Domain Prompt**: Ask user for domain prefix on initial deployment
4. **Conditional Test Deployments**: Only show dry-run/test deployments in development mode

---

## 🔍 What the Parent Repo Does (Reference)

### **1. Environment Variables**

**Location:** `easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts:165-228`

**How it works:**
```typescript
const environmentVariables = [
  // GitHub repo configuration
  {
    key: "REPO_OWNER",
    value: githubOwner, // Dynamic per deployment
    type: "plain" as const,
    target: ["production", "preview", "development"] as const,
  },
  {
    key: "REPO_NAME",
    value: repoName, // Dynamic per deployment
    type: "plain" as const,
    target: ["production", "preview", "development"] as const,
  },
  // API Keys (encrypted)
  {
    key: "OPENAI_KEY",
    value: process.env.OPENAI_KEY || "",
    type: "encrypted" as const,
    target: ["production", "preview", "development"] as const,
  },
  {
    key: "GITHUB_TOKEN",
    value: process.env.GITHUB_TOKEN || "",
    type: "encrypted" as const,
    target: ["production", "preview", "development"] as const,
  },
  // ... more keys
];

// Pass to Vercel project creation
project = await vercelClient.createProject({
  name: repoName,
  environmentVariables, // ✅ Passed here
});
```

**Benefits:**
- Each deployed site gets its own `REPO_OWNER` and `REPO_NAME`
- API keys are encrypted and never committed to Git
- All environments (production/preview/development) get the vars

---

### **2. Custom Domain Configuration**

**Location:** `easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts:288-319`

**How it works:**
```typescript
const DOMAIN_NAME = process.env.DOMAIN_NAME;
let deploymentUrl: string;

if (DOMAIN_NAME) {
  // Custom domain pattern: {projectName}.dev.{DOMAIN_NAME}
  // Example: samurai-training.dev.mydomain.com
  const customDomain = `${repoName}.dev.${DOMAIN_NAME}`;

  console.log(`Adding custom domain: ${customDomain}`);

  try {
    await vercelClient.addDomain(project.id, customDomain);
    deploymentUrl = `https://${customDomain}`;
    console.log(`✅ Custom domain added: ${customDomain}`);
  } catch (domainError) {
    console.warn(`⚠️  Could not add custom domain`);
    // Fallback to Vercel URL
    deploymentUrl = `https://${repoName}-git-development-${githubOwner.toLowerCase()}.vercel.app`;
  }
} else {
  // No custom domain, use Vercel URL
  deploymentUrl = `https://${repoName}-git-development-${githubOwner.toLowerCase()}.vercel.app`;
}
```

**Domain Pattern:**
- Development: `{repoName}.dev.{DOMAIN_NAME}`
- Production: `{repoName}.{DOMAIN_NAME}` (potential)
- Fallback: Vercel's auto-generated URL

**DNS Configuration Required:**
```
Type: CNAME
Name: {repoName}.dev
Value: cname.vercel-dns.com
```

---

### **3. Domain Prompt (Dry Run Has It)**

**Location:** Dry-run asks for `repoName` which becomes domain prefix

**Current Issue:**
- ✅ Dry-run accepts `repoName` as input
- ❌ Actual deployment doesn't prompt user for domain preference
- ❌ Uses auto-generated domain without user input

**Expected Behavior:**
```
User Flow:
1. User clicks "Deploy to Production"
2. Modal asks: "What domain name would you like?"
   Input: [samurai-training]  (user enters prefix)
3. Shows preview: "Your site will be at:"
   - samurai-training.dev.mydomain.com (if DOMAIN_NAME set)
   - samurai-training.vercel.app (fallback)
4. User confirms → Deployment starts
```

---

### **4. Conditional Test Deployments**

**Current Issue:**
- Test deployment buttons (dry-run, push-to-github-only, etc.) are always visible
- Should only show in development mode

**Expected Behavior:**
```typescript
// Only show test buttons in development
const isDevelopment = process.env.NODE_ENV === 'development';

{isDevelopment && (
  <>
    <button>Dry Run Deployment</button>
    <button>Push to GitHub Only</button>
    <button>Test Build</button>
  </>
)}

// Production button always visible
<button>Deploy to Production</button>
```

---

## 🎯 Implementation Plan

### **Task 1: Add Environment Variables to Vercel Projects**

**Files to modify:**
1. `src/lib/vercel/vercel-operations.ts` (if exists)
2. Or create new Vercel client similar to parent repo

**Changes:**
```typescript
// When creating Vercel project, pass environment variables
const environmentVariables = [
  {
    key: "REPO_OWNER",
    value: githubOwner,
    type: "plain",
    target: ["production", "preview", "development"],
  },
  {
    key: "REPO_NAME",
    value: repoName,
    type: "plain",
    target: ["production", "preview", "development"],
  },
  {
    key: "CURRENT_BRANCH",
    value: "development",
    type: "plain",
    target: ["production", "preview", "development"],
  },
  {
    key: "PRODUCTION_BRANCH",
    value: "main",
    type: "plain",
    target: ["production", "preview", "development"],
  },
  {
    key: "GITHUB_TOKEN",
    value: process.env.GITHUB_TOKEN || "",
    type: "encrypted",
    target: ["production", "preview", "development"],
  },
  {
    key: "ANTHROPIC_API_KEY",
    value: process.env.ANTHROPIC_API_KEY || "",
    type: "encrypted",
    target: ["production", "preview", "development"],
  },
  // Add other required keys
];

// Pass to createProject or setEnvironmentVariables
await vercelClient.setEnvironmentVariables(projectId, environmentVariables);
```

**Reference:** `easy-money/frontend/src/lib/vercel/vercel-client.ts:273-311`

---

### **Task 2: Use DOMAIN_NAME for Custom Domains**

**Files to modify:**
1. `src/app/api/production/deploy/route.ts`
2. `src/lib/deploy/vercel-operations.ts`

**Changes:**
```typescript
// Check for custom domain
const DOMAIN_NAME = process.env.DOMAIN_NAME;
let deploymentUrl: string;

if (DOMAIN_NAME) {
  const customDomain = `${projectName}.dev.${DOMAIN_NAME}`;

  try {
    await vercelClient.addDomain(projectId, customDomain);
    deploymentUrl = `https://${customDomain}`;
  } catch (error) {
    // Fallback to vercel.app
    deploymentUrl = `https://${projectName}.vercel.app`;
  }
} else {
  // No custom domain set
  deploymentUrl = `https://${projectName}.vercel.app`;
}
```

**Environment Variable:**
Add to `.env.local`:
```bash
DOMAIN_NAME=yourdomain.com
```

**Reference:** `easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts:288-319`

---

### **Task 3: Add Domain Prompt for Initial Deployment**

**Files to modify:**
1. `src/components/editor/deploymentPanel/DeploymentPanel.tsx` (or similar)
2. Create new modal component: `DomainNameModal.tsx`

**UI Flow:**
```
1. User clicks "Deploy to Production"
2. Show modal:
   ┌─────────────────────────────────────────┐
   │ Choose Your Domain Name                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Your site will be available at:         │
   │                                         │
   │ https://[____________].dev.mydomain.com │
   │         ^                               │
   │         Enter domain prefix here        │
   │                                         │
   │ Or:                                     │
   │ https://[____________].vercel.app       │
   │                                         │
   │ [Cancel]              [Deploy] ───────→ │
   └─────────────────────────────────────────┘
3. Validate input (lowercase, no spaces, alphanumeric+hyphens)
4. Pass to deployment API
```

**Code:**
```typescript
const [showDomainModal, setShowDomainModal] = useState(false);
const [projectName, setProjectName] = useState('');

const handleDeployClick = () => {
  setShowDomainModal(true);
};

const handleDomainConfirm = (domainName: string) => {
  // Start deployment with custom domain
  deployToProduction({
    websiteData,
    projectName: domainName
  });
};
```

**Validation:**
```typescript
const validateDomainName = (name: string): boolean => {
  // Lowercase letters, numbers, hyphens only
  // No consecutive hyphens
  // No leading/trailing hyphens
  const regex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return regex.test(name) && name.length >= 3 && name.length <= 63;
};
```

**Reference:** User flow from parent repo deployment

---

### **Task 4: Conditional Rendering for Test Deployments**

**Files to modify:**
1. `src/components/editor/deploymentPanel/DeploymentPanel.tsx`
2. Any component showing deployment options

**Changes:**
```typescript
// At top of component
const isDevelopment = process.env.NODE_ENV === 'development';

// In JSX
return (
  <div>
    {/* Always show production deployment */}
    <button onClick={handleProductionDeploy}>
      Deploy to Production
    </button>

    {/* Only show test options in development */}
    {isDevelopment && (
      <div className="test-deployments">
        <h3>Test Deployments (Development Only)</h3>
        <button onClick={handleDryRun}>
          Dry Run (Simulate)
        </button>
        <button onClick={handlePushToGitHubOnly}>
          Push to GitHub (No Vercel)
        </button>
        <button onClick={handleTestBuild}>
          Test Build Locally
        </button>
      </div>
    )}
  </div>
);
```

**Environment Check:**
```typescript
// process.env.NODE_ENV is set by Next.js automatically
// 'development' when running 'npm run dev'
// 'production' when running 'npm run build' and 'npm start'
// 'test' when running tests

const isDevelopment = process.env.NODE_ENV === 'development';
```

---

## 📝 Environment Variables Checklist

**Required `.env` vars for deployment:**

```bash
# GitHub
GITHUB_TOKEN=ghp_xxx...

# Vercel
VERCEL_API_TOKEN=xxx...
VERCEL_TEAM_ID=team_xxx... # Optional

# Custom Domain (Optional)
DOMAIN_NAME=yourdomain.com # e.g., "tmuse333.com"

# API Keys to pass to deployed projects
ANTHROPIC_API_KEY=sk-ant-xxx...
OPENAI_KEY=sk-xxx...
MONGODB_URI=mongodb+srv://xxx...
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx...
```

**Which vars get passed to deployed projects:**
- ✅ REPO_OWNER (dynamic, per deployment)
- ✅ REPO_NAME (dynamic, per deployment)
- ✅ CURRENT_BRANCH (development)
- ✅ PRODUCTION_BRANCH (main)
- ✅ GITHUB_TOKEN (from parent)
- ✅ ANTHROPIC_API_KEY (from parent)
- ✅ OPENAI_KEY (from parent)
- ✅ MONGODB_URI (from parent)
- ✅ BLOB_READ_WRITE_TOKEN (from parent)

---

## 🧪 Testing Plan

### **1. Test Environment Variables**

```bash
# 1. Deploy a test project
curl -X POST http://localhost:3000/api/deployment/deploy \
  -H "Content-Type: application/json" \
  -d '{"websiteData": {...}, "projectName": "test-site"}'

# 2. Check Vercel project settings
# Go to: https://vercel.com/{team}/test-site/settings/environment-variables
# Verify: REPO_OWNER, REPO_NAME, GITHUB_TOKEN, etc. are set

# 3. Check deployed site
# Verify: Site loads data from its own repo (not template repo)
```

### **2. Test Custom Domain**

```bash
# 1. Set DOMAIN_NAME in .env
DOMAIN_NAME=mytestdomain.com

# 2. Deploy project
# Expected domain: test-site.dev.mytestdomain.com

# 3. Configure DNS (if domain is real)
Type: CNAME
Name: test-site.dev
Value: cname.vercel-dns.com

# 4. Wait for DNS propagation (can take 24-48 hours)
# 5. Visit: https://test-site.dev.mytestdomain.com
```

### **3. Test Domain Prompt**

```bash
# 1. Click "Deploy to Production"
# 2. Modal should appear asking for domain name
# 3. Enter: "my-awesome-site"
# 4. Preview should show:
#    - my-awesome-site.dev.mytestdomain.com (if DOMAIN_NAME set)
#    - my-awesome-site.vercel.app (fallback)
# 5. Click "Deploy"
# 6. Deployment should use entered name
```

### **4. Test Conditional Rendering**

```bash
# Development mode (npm run dev)
# Should see:
# - Deploy to Production ✅
# - Dry Run ✅
# - Push to GitHub Only ✅
# - Test Build ✅

# Production mode (npm run build && npm start)
# Should see:
# - Deploy to Production ✅
# - Dry Run ❌ (hidden)
# - Push to GitHub Only ❌ (hidden)
# - Test Build ❌ (hidden)
```

---

## 🚨 Important Notes

### **Security:**
- Environment variables with `type: "encrypted"` are encrypted at rest in Vercel
- Never commit API keys to Git
- Only pass necessary env vars to each deployment

### **Domain Configuration:**
- Custom domains require DNS configuration
- DNS changes can take 24-48 hours to propagate
- Fallback to `vercel.app` if custom domain fails

### **Vercel API Limits:**
- Free tier: Limited deployments per month
- Team tier: Higher limits
- Check Vercel dashboard for usage

---

## ✅ Completion Checklist

- [ ] Task 1: Add environment variables to Vercel projects
- [ ] Task 2: Use DOMAIN_NAME for custom domains
- [ ] Task 3: Add domain prompt for initial deployment
- [ ] Task 4: Conditional rendering for test deployments
- [ ] Test environment variables are set correctly
- [ ] Test custom domain configuration works
- [ ] Test domain prompt UI
- [ ] Test conditional rendering in dev/prod modes
- [ ] Update documentation
- [ ] Update `.env.example` with required vars

---

## 📚 Reference Files

**From Parent Repo (`../../easy-money`):**
- `frontend/src/lib/vercel/vercel-client.ts` - Vercel API client
- `frontend/src/app/api/deployment/deploy-to-vercel/route.ts` - Deployment with env vars & domain
- `frontend/src/app/api/deployment/dry-run-sse/route.ts` - Dry run implementation

**To Modify in Template:**
- `src/lib/deploy/vercel-operations.ts` - Add env var logic
- `src/app/api/production/deploy/route.ts` - Add domain logic
- `src/components/editor/deploymentPanel/*` - Add domain prompt & conditional rendering

---

## 🎯 Priority Order

1. **High Priority:**
   - Task 1: Environment variables (critical for multi-tenant)
   - Task 2: Custom domains (better UX)

2. **Medium Priority:**
   - Task 3: Domain prompt (UX improvement)

3. **Low Priority:**
   - Task 4: Conditional rendering (cleanup)

---

## 💡 Next Steps

1. Review this document
2. Confirm approach for each task
3. Create implementation plan
4. Start with Task 1 (environment variables)
5. Test thoroughly before merging to development

---

**Questions to Answer:**

1. Should domain prompt be required or optional?
2. What's the default domain pattern? (username-sitename vs custom)
3. Should we support production domain pattern too? (`{name}.{DOMAIN}` vs `{name}.dev.{DOMAIN}`)
4. Which environment variables are truly needed for deployed sites?
