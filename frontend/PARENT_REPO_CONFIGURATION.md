# Parent Repo Configuration Guide

**Document Purpose:** Instructions for configuring the parent repo (`easy-money`) to properly deploy child instances of this template with correct GitHub and Vercel integration.

---

## Architecture Overview

```
Parent Repo (easy-money)
  │
  ├─ Creates child GitHub repo from template
  ├─ Injects components + websiteData.json
  ├─ Creates Vercel project
  └─ Sets environment variables (REPO_OWNER, REPO_NAME, etc.)
       │
       ▼
Child Repo (deployed instance)
  │
  ├─ Reads REPO_OWNER & REPO_NAME from Vercel env vars
  ├─ Fetches websiteData.json from its OWN GitHub repo
  ├─ Connects to shared MongoDB
  └─ Renders user's custom website
```

---

## Current Issue

The child template is **hardcoded** to fetch data from:
- **GitHub Repo:** `TMuse333/next-js-template`
- **Branch:** `experiment`

When deployed for different users, this causes **404 errors** because the child tries to access the hardcoded repo instead of its own deployed repo.

**Solution:** Parent must pass dynamic `REPO_OWNER` and `REPO_NAME` via Vercel environment variables (already partially implemented).

---

## 1. Parent Repo Environment Variables

### Required Variables in Parent's `.env`

**File Location:** `/easy-money/frontend/.env`

```bash
# ============================================
# GitHub Configuration (Parent Template)
# ============================================
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx        # PAT with repo permissions
GITHUB_USERNAME=TMuse333                      # Parent GitHub username
GITHUB_REPO=next-js-template                  # Template repo name

# ============================================
# Vercel API
# ============================================
VERCEL_API_TOKEN=xxxxxxxxxxxxxxxxxxxxx        # Vercel API token with project creation permissions
DOMAIN_NAME=focusflowsoftware.com             # Base domain for custom domains

# ============================================
# Shared Services (Passed to Child Repos)
# ============================================
OPENAI_KEY=sk-proj-xxxxxxxxxxxxx              # OpenAI API key
MONGODB_URI=mongodb+srv://xxxxxxxxxxxxx       # Shared MongoDB connection
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx       # Anthropic Claude API key
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx    # Vercel Blob storage token

# ============================================
# Stripe (Payment Processing)
# ============================================
STRIPE_SK=sk_test_xxxxxxxxxxxxxxxx            # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx # Stripe publishable key

# ============================================
# Email (Notifications)
# ============================================
SMTP_USER=focusflowwebsite@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx                 # Gmail app password
ADMIN_EMAIL=thomaslmusial@gmail.com
```

---

## 2. Vercel Environment Variables (Critical)

### Variables Passed to Each Child Deployment

**File Location:** `/easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts`

**Current Implementation (Lines ~180-250):**

```typescript
environmentVariables: [
  // ============================================
  // CRITICAL: Repo-Specific Configuration
  // ============================================
  {
    key: "REPO_OWNER",
    value: githubOwner,              // ✅ Dynamic: user's GitHub username
    type: "plain",
    target: ["production", "preview", "development"]
  },
  {
    key: "REPO_NAME",
    value: repoName,                 // ✅ Dynamic: project slug
    type: "plain",
    target: ["production", "preview", "development"]
  },
  {
    key: "CURRENT_BRANCH",
    value: "development",            // ⚠️ Consider making dynamic
    type: "plain",
    target: ["production", "preview", "development"]
  },

  // ============================================
  // Shared API Keys (Encrypted)
  // ============================================
  {
    key: "OPENAI_KEY",
    value: process.env.OPENAI_KEY,
    type: "encrypted",
    target: ["production", "preview", "development"]
  },
  {
    key: "MONGODB_URI",
    value: process.env.MONGODB_URI,
    type: "encrypted",
    target: ["production", "preview", "development"]
  },
  {
    key: "ANTHROPIC_API_KEY",
    value: process.env.ANTHROPIC_API_KEY,
    type: "encrypted",
    target: ["production", "preview", "development"]
  },
  {
    key: "GITHUB_TOKEN",
    value: process.env.GITHUB_TOKEN,  // Child needs this to fetch from own repo
    type: "encrypted",
    target: ["production", "preview", "development"]
  },
  {
    key: "VERCEL_API_TOKEN",
    value: process.env.VERCEL_API_TOKEN,
    type: "encrypted",
    target: ["production", "preview", "development"]
  },
  {
    key: "BLOB_READ_WRITE_TOKEN",
    value: process.env.BLOB_READ_WRITE_TOKEN,
    type: "encrypted",
    target: ["production", "preview", "development"]
  }
]
```

### ✅ What's Working
- `REPO_OWNER` is dynamically set per deployment
- `REPO_NAME` is dynamically set per deployment
- Shared API keys are passed correctly

### ⚠️ Potential Issues
1. **`CURRENT_BRANCH` hardcoded to "development"**
   - Should match the branch child repos use by default
   - Current child template defaults to "experiment" - **MISMATCH!**

2. **`PRODUCTION_BRANCH` not passed**
   - Child template expects this env var
   - Defaults to "main" in child, which may be correct

---

## 3. Required Parent Repo Code Changes

### 3.1 Fix Branch Configuration Mismatch

**File:** `/easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts`

**Current:**
```typescript
{
  key: "CURRENT_BRANCH",
  value: "development",  // ❌ Child expects "experiment"
  type: "plain",
  target: ["production", "preview", "development"]
}
```

**Option A: Change Child Template Default**
Update child's `src/lib/config.ts`:
```typescript
CURRENT_BRANCH: process.env.CURRENT_BRANCH || "development",  // Match parent
```

**Option B: Change Parent to Match Child**
Update parent's deployment route:
```typescript
{
  key: "CURRENT_BRANCH",
  value: "experiment",  // Match child's current default
  type: "plain",
  target: ["production", "preview", "development"]
}
```

**Recommendation:** Use Option A (standardize on "development" branch)

---

### 3.2 Add PRODUCTION_BRANCH Environment Variable

**File:** `/easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts`

**Add this to environment variables array:**
```typescript
{
  key: "PRODUCTION_BRANCH",
  value: "main",
  type: "plain",
  target: ["production", "preview", "development"]
},
```

---

### 3.3 Validate GitHub Token Permissions

**Required GitHub Token Scopes:**
- ✅ `repo` (full control of private repositories)
- ✅ `workflow` (update GitHub Actions workflows)
- ✅ `admin:org` (if creating repos in organization)

**Verify Token Has Access to:**
- Read template repo (`TMuse333/next-js-template`)
- Create new repos in user's account or organization
- Push commits to created repos

---

### 3.4 MongoDB Connection String Format

**Ensure child repos can connect to MongoDB:**

**Current Child Code:** `src/lib/mongodb/mongodb.ts`
```typescript
const uri = process.env.MONGODB_URI!;
const client = await clientPromise;
const db = client.db("client_websites");
```

**Parent Must Pass:**
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

**MongoDB User Permissions:**
- ✅ Read/Write access to `client_websites` database
- ✅ Collections: `websitemasters`, `useraccounts`

---

## 4. GitHub Repo Creation Configuration

### 4.1 Template Repo Setup

**Parent References Template:**
- **Owner:** `TMuse333` (from `GITHUB_USERNAME`)
- **Repo:** `next-js-template` (from `GITHUB_REPO`)

**Template Repo Settings (on GitHub):**
1. ✅ Repository marked as **Template Repository**
   - Settings → General → Template repository checkbox
2. ✅ Include all branches (for "experiment" branch)
3. ✅ Public or Private based on preference

---

### 4.2 Repo Creation Parameters

**File:** `/easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts`

```typescript
const repo = await octokit.repos.createUsingTemplate({
  template_owner: TEMPLATE_REPO_OWNER,  // "TMuse333"
  template_repo: TEMPLATE_REPO_NAME,    // "next-js-template"
  owner: githubOwner,                   // Dynamic: user's GitHub username
  name: repoName,                       // Dynamic: project slug
  private: false,                       // ⚠️ Consider making configurable
  include_all_branches: true            // ✅ Includes "experiment" branch
});
```

**Configuration Options:**

| Parameter | Current Value | Recommendation |
|-----------|---------------|----------------|
| `private` | `false` | Make configurable per user preference |
| `include_all_branches` | `true` | Keep true to include "experiment"/"development" branches |
| `description` | Not set | Add user's business name as description |

---

## 5. Component Injection Configuration

### 5.1 Component Collection Path

**File:** `/easy-money/frontend/src/lib/deployment/componentInjection.ts`

**Parent Collects Components From:**
```
/easy-money/frontend/src/components/designs/
```

**Injected Into Child At:**
```
/{repoName}/frontend/src/components/designs/
```

**File Structure Maintained:**
```
designs/
├── herobanners/
│   ├── auroraImageHero/
│   │   ├── auroraImageHeroEdit.tsx
│   │   ├── auroraImageHero.prod.tsx
│   │   └── index.ts
```

---

### 5.2 Generated Files

**Parent Creates These Files in Child Repo:**

1. **`componentMap.tsx`**
   - Registers all Edit components
   - Maps component type → React component

2. **`constants.ts`**
   - Component metadata (category, name, icons)

3. **`websiteData.json`**
   - User's custom website data
   - Component configurations
   - Page structure

**Location in Child:** `/frontend/src/data/`

---

### 5.3 Git Commit Strategy

**Current Implementation:**
- **Single commit** with all files (~35+ components + config files)
- Prevents Vercel deployment spam

**Commit Message Format:**
```
Inject website components and data

- Added {componentCount} components from template
- Generated componentMap.tsx and constants.ts
- Initialized websiteData.json with user configuration
```

**Branch:** `development` (or configured branch)

---

## 6. Vercel Project Configuration

### 6.1 Project Creation Settings

**File:** `/easy-money/frontend/src/lib/vercel/vercel-client.ts`

```typescript
const project = await fetch("https://api.vercel.com/v9/projects", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${this.token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: repoName,                    // Must match GitHub repo name
    framework: "nextjs",
    gitRepository: {
      type: "github",
      repo: `${githubOwner}/${repoName}`,  // Dynamic per user
    },
    rootDirectory: "frontend",         // ⚠️ Critical: monorepo structure
    buildCommand: "npm run build",     // Default Next.js build
    installCommand: "npm install",     // Default npm install
    environmentVariables: [...]        // See section 2
  }),
});
```

---

### 6.2 Monorepo Configuration

**Critical Setting:**
```typescript
rootDirectory: "frontend"
```

**Why This Matters:**
- Template uses monorepo structure: `/frontend/` contains Next.js app
- Without this, Vercel will try to build from root (fails)
- Build commands run from `frontend/` directory

**Verify in Template:**
```
next-js-template/
├── frontend/              ← Vercel builds from here
│   ├── package.json
│   ├── next.config.js
│   └── src/
└── other-directories/
```

---

### 6.3 Build & Install Commands

**Current Configuration:**
```typescript
buildCommand: "npm run build"
installCommand: "npm install"
```

**Recommended Optimizations:**
```typescript
buildCommand: "npm run build",
installCommand: "npm ci",              // Faster, deterministic installs
devCommand: "npm run dev",
outputDirectory: ".next"               // Next.js build output
```

---

### 6.4 Framework Detection

**Setting:** `framework: "nextjs"`

**Vercel Auto-Configuration:**
- ✅ Detects Next.js version from `package.json`
- ✅ Optimizes build process for Next.js
- ✅ Enables ISR, SSR, API routes
- ✅ Sets up middleware, rewrites, redirects

---

## 7. Domain Configuration

### 7.1 Custom Domain Pattern

**File:** `/easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts`

```typescript
const customDomain = `${repoName}.dev.${DOMAIN_NAME}`;
// Example: my-business.dev.focusflowsoftware.com

await vercelClient.addDomain(project.id, customDomain);
```

---

### 7.2 DNS Configuration Requirements

**Parent Domain:** `focusflowsoftware.com`

**Required DNS Records:**
```
Type: A
Host: *.dev
Value: 76.76.21.21  (Vercel IP)

OR

Type: CNAME
Host: *.dev
Value: cname.vercel-dns.com
```

**Verify:**
- ✅ Wildcard DNS allows unlimited subdomains
- ✅ SSL certificates auto-provisioned by Vercel
- ✅ HTTP → HTTPS redirect enabled

---

### 7.3 Domain Verification

**Vercel API Flow:**
1. Parent calls `addDomain(projectId, domain)`
2. Vercel returns verification status
3. If DNS not configured: returns error with instructions
4. If DNS configured: auto-provisions SSL

**Handle Verification Errors:**
```typescript
try {
  await vercelClient.addDomain(project.id, customDomain);
} catch (error) {
  if (error.code === "domain_verification_failed") {
    // Log for admin to configure DNS
    console.error(`DNS not configured for ${customDomain}`);
    // Still create project, domain can be added later
  }
}
```

---

## 8. Data Flow & Synchronization

### 8.1 Initial Data Injection

**Flow:**
```
1. User fills form in Parent UI
2. Parent saves to MongoDB (WebsiteMaster)
3. Parent creates GitHub repo from template
4. Parent pushes websiteData.json to child repo
5. Parent creates Vercel project → auto-deploys
```

**Data Source:** MongoDB `websitemasters` collection

**Transformation:**
```typescript
// MongoDB WebsiteMaster → websiteData.json
{
  websiteName: master.websiteName,
  templateName: master.templateName,
  colorTheme: master.colorTheme,
  pages: master.pages.map(normalizePage),  // Optimize structure
  // ... other fields
}
```

---

### 8.2 Child Fetches Data From Own Repo

**Child Code:** `src/stores/slices/websiteDataSlice.ts`

```typescript
const REPO_OWNER = process.env.REPO_OWNER;  // From parent via Vercel
const REPO_NAME = process.env.REPO_NAME;    // From parent via Vercel
const CURRENT_BRANCH = process.env.CURRENT_BRANCH || "development";

// Fetch from child's own GitHub repo
const response = await fetch(
  `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${CURRENT_BRANCH}`
);

// Find websiteData.json in commit tree
const dataPath = "frontend/src/data/websiteData.json";
```

**Critical:** Child must NEVER fetch from hardcoded `TMuse333/next-js-template`

---

### 8.3 Version Control & Updates

**Parent Updates Child Data:**
1. User edits website in Parent UI
2. Parent saves to MongoDB
3. Parent pushes updated `websiteData.json` to child GitHub repo
4. Vercel auto-redeploys child on new commit
5. Child fetches latest data on next load

**API Route:** `/easy-money/frontend/src/app/api/versions/create-github/route.ts`

**Requires:**
- `GITHUB_TOKEN` with push access to child repo
- Child repo name from MongoDB

---

## 9. Validation & Error Handling

### 9.1 Pre-Deployment Validation

**File:** `/easy-money/frontend/src/app/api/deployment/deploy-to-vercel/route.ts`

**Add Validation Checks:**

```typescript
// Validate required environment variables
const requiredEnvVars = [
  "GITHUB_TOKEN",
  "GITHUB_USERNAME",
  "VERCEL_API_TOKEN",
  "MONGODB_URI",
  "OPENAI_KEY"
];

const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

// Validate MongoDB connection
await connectToDB();

// Validate GitHub token permissions
const { data: user } = await octokit.users.getAuthenticated();
console.log(`Deploying as GitHub user: ${user.login}`);

// Validate Vercel API token
const vercelClient = new VercelClient(process.env.VERCEL_API_TOKEN!);
await vercelClient.getUser();  // Throws if token invalid
```

---

### 9.2 Deployment Error Handling

**Common Errors & Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `404: Repository not found` | GitHub token lacks permissions | Regenerate token with `repo` scope |
| `422: Name already exists` | Repo name taken | Append timestamp or increment counter |
| `403: Resource not accessible` | Vercel token invalid | Regenerate Vercel API token |
| `DNS_VERIFICATION_FAILED` | Domain DNS not configured | Configure wildcard DNS for `*.dev.focusflowsoftware.com` |
| `RATE_LIMIT_EXCEEDED` | Too many API calls | Implement retry logic with exponential backoff |

---

### 9.3 Rollback Strategy

**If Deployment Fails:**

1. **Delete Vercel Project:**
   ```typescript
   await vercelClient.deleteProject(projectId);
   ```

2. **Delete GitHub Repo (Optional):**
   ```typescript
   await octokit.repos.delete({
     owner: githubOwner,
     repo: repoName
   });
   ```

3. **Update MongoDB Status:**
   ```typescript
   await WebsiteMaster.updateOne(
     { _id: masterId },
     {
       deploymentStatus: "failed",
       deploymentError: error.message
     }
   );
   ```

4. **Refund User (if applicable)**

---

## 10. Security Considerations

### 10.1 API Token Security

**GitHub Token:**
- ✅ Stored in parent `.env` (not committed)
- ✅ Passed to child as encrypted Vercel env var
- ⚠️ **EXPOSED IN CHILD'S `.env` FILE!** (Lines show token in plaintext)
  - **Action Required:** Remove from child's `.env` before committing

**Vercel Token:**
- ✅ Stored in parent `.env`
- ✅ Passed to child as encrypted env var
- ✅ Scoped to team/user account

**Recommendation:**
```bash
# Child repo .env.example (committed)
GITHUB_TOKEN=ghp_your_token_here

# Child repo .env (NOT committed, in .gitignore)
GITHUB_TOKEN=actual_secret_token
```

---

### 10.2 MongoDB Security

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

**Security Checklist:**
- ✅ Use dedicated MongoDB user per environment
- ✅ Restrict user to `client_websites` database only
- ✅ Enable IP whitelisting (Vercel IPs + local dev)
- ✅ Rotate passwords periodically
- ⚠️ Child repos share same MongoDB (all can access all data)
  - **Mitigation:** Implement row-level security with `owner` field filtering

---

### 10.3 Shared API Keys

**Current Implementation:**
All child repos share:
- OpenAI API key
- Anthropic API key
- Vercel Blob storage token

**Risks:**
- ⚠️ Rate limits shared across all deployments
- ⚠️ Usage tracking difficult
- ⚠️ One compromised child = all children compromised

**Recommendations:**
1. **Implement API Gateway** in parent
   - Children call parent's API
   - Parent forwards to OpenAI/Anthropic with rate limiting
2. **Per-Project API Keys** (if budget allows)
3. **Usage Monitoring** in MongoDB

---

## 11. Testing & Dry Run

### 11.1 Dry Run API

**Endpoint:** `/api/deployment/dry-run`

**Purpose:** Test deployment without creating actual resources

**Flow:**
1. Validates environment variables
2. Checks GitHub token permissions
3. Verifies template repo exists
4. Simulates component injection
5. Returns preview of files to be created

**Usage:**
```bash
curl -X POST http://localhost:3000/api/deployment/dry-run \
  -H "Content-Type: application/json" \
  -d '{
    "projectSlug": "test-business",
    "githubUsername": "testuser"
  }'
```

---

### 11.2 SSE Deployment (Real-time Updates)

**Endpoint:** `/api/deployment/deploy-sse`

**Purpose:** Deploy with Server-Sent Events for real-time progress

**Flow:**
```
Client connects → SSE stream opens
  ├─ Event: "Validating environment..."
  ├─ Event: "Creating GitHub repository..."
  ├─ Event: "Injecting components... (15/35)"
  ├─ Event: "Creating Vercel project..."
  ├─ Event: "Deploying to production..."
  └─ Event: "Deployment complete!"
```

**Use in Parent UI:**
```typescript
const eventSource = new EventSource(`/api/deployment/deploy-sse?projectSlug=${slug}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateProgressBar(data.progress);
  showMessage(data.message);
};
```

---

## 12. Monitoring & Maintenance

### 12.1 Deployment Logging

**Log Critical Events:**
- GitHub repo creation success/failure
- Vercel project creation success/failure
- Environment variable injection
- Component injection counts
- Domain configuration status

**Storage:** MongoDB or external logging service (Datadog, LogRocket)

---

### 12.2 Child Repo Health Checks

**Monitor:**
- ✅ Vercel deployment status (via Vercel API)
- ✅ GitHub repo activity (last commit timestamp)
- ✅ Domain DNS status
- ✅ SSL certificate expiry

**Parent Dashboard:**
Display all deployed children with status indicators:
```
Client A - my-business.dev.focusflowsoftware.com
  ├─ ✅ GitHub: Active (last commit 2h ago)
  ├─ ✅ Vercel: Deployed (production)
  └─ ✅ Domain: SSL valid until 2026-12-31

Client B - another-site.dev.focusflowsoftware.com
  ├─ ⚠️ GitHub: No commits in 30 days
  ├─ ❌ Vercel: Build failed
  └─ ✅ Domain: SSL valid
```

---

## 13. Parent Repo Checklist

### ✅ Environment Variables Configured

- [ ] `GITHUB_TOKEN` (with `repo` scope)
- [ ] `GITHUB_USERNAME` (template owner)
- [ ] `GITHUB_REPO` (template repo name)
- [ ] `VERCEL_API_TOKEN` (with project creation)
- [ ] `DOMAIN_NAME` (base domain)
- [ ] `MONGODB_URI` (shared database)
- [ ] `OPENAI_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `BLOB_READ_WRITE_TOKEN`

### ✅ GitHub Configuration

- [ ] Template repo marked as "Template Repository"
- [ ] Template repo includes all necessary branches
- [ ] GitHub token has permissions to:
  - [ ] Read template repo
  - [ ] Create repos in user's account
  - [ ] Push to created repos

### ✅ Vercel Configuration

- [ ] API token has project creation permissions
- [ ] Wildcard DNS configured: `*.dev.focusflowsoftware.com`
- [ ] Team/account has sufficient project slots

### ✅ Vercel Environment Variables (Passed to Children)

- [ ] `REPO_OWNER` (dynamic per deployment)
- [ ] `REPO_NAME` (dynamic per deployment)
- [ ] `CURRENT_BRANCH` (matches child default, recommend "development")
- [ ] `PRODUCTION_BRANCH` (recommend "main")
- [ ] All shared API keys (encrypted)

### ✅ MongoDB Configuration

- [ ] Database `client_websites` exists
- [ ] Collections `websitemasters` and `useraccounts` exist
- [ ] User has read/write permissions
- [ ] IP whitelist includes Vercel IPs

### ✅ Component Library

- [ ] All components in `/src/components/designs/` are production-ready
- [ ] Component naming follows convention: `{componentName}Edit.tsx`, `{componentName}.prod.tsx`
- [ ] `index.ts` files properly export components

### ✅ Deployment API Routes

- [ ] `/api/deployment/deploy-to-vercel` - Main deployment
- [ ] `/api/deployment/deploy-sse` - Real-time deployment
- [ ] `/api/deployment/dry-run` - Testing
- [ ] `/api/github/create-repo` - Repo creation

### ✅ Error Handling

- [ ] Environment variable validation
- [ ] GitHub API error handling
- [ ] Vercel API error handling
- [ ] Rollback strategy implemented

---

## 14. Common Pitfalls & Solutions

### Issue 1: "Failed to fetch latest commit: Not Found"

**Cause:** Child repo is fetching from hardcoded `TMuse333/next-js-template` instead of its own repo

**Solution:**
- ✅ Ensure parent passes `REPO_OWNER` and `REPO_NAME` via Vercel env vars
- ✅ Update child template to use these env vars (not hardcoded defaults)
- ✅ Verify child's `src/lib/config.ts` reads from `process.env`

**Verify in Vercel Dashboard:**
```
Project Settings → Environment Variables
  ├─ REPO_OWNER = actual-username
  └─ REPO_NAME = actual-repo-name
```

---

### Issue 2: Branch Mismatch (development vs experiment)

**Cause:** Parent sets `CURRENT_BRANCH=development`, child defaults to `experiment`

**Solution:** **Standardize on one branch name**

**Recommendation:**
- Parent: Set `CURRENT_BRANCH=development`
- Child: Update `src/lib/config.ts` default to `development`
- Template repo: Rename `experiment` → `development` branch

---

### Issue 3: Component Injection Fails

**Cause:** Component files missing in parent repo

**Solution:**
- ✅ Verify all components exist in `/easy-money/frontend/src/components/designs/`
- ✅ Check component naming conventions
- ✅ Ensure `Edit.tsx` and `.prod.tsx` versions exist

**Debug:**
```typescript
// In componentInjection.ts
console.log("Components found:", componentFiles.length);
console.log("Component types:", usedComponents);
```

---

### Issue 4: MongoDB Connection Timeout

**Cause:** Vercel IP not whitelisted in MongoDB Atlas

**Solution:**
1. MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allow all, Vercel uses dynamic IPs)
   - **Or:** Add Vercel's static IPs if using Enterprise plan

---

### Issue 5: Vercel Build Fails - "Cannot find module"

**Cause:** `rootDirectory` not set to `frontend`

**Solution:**
```typescript
// In vercel-client.ts
rootDirectory: "frontend",  // Critical for monorepo
```

---

### Issue 6: Domain SSL Certificate Not Provisioning

**Cause:** DNS not configured or propagation delay

**Solution:**
1. Verify DNS: `dig my-business.dev.focusflowsoftware.com`
2. Should return Vercel IP or CNAME
3. Wait 24-48 hours for SSL provisioning
4. Check Vercel dashboard for verification status

---

## 15. Future Enhancements

### 15.1 Multi-Template Support

**Current:** Hardcoded to `next-js-template`

**Enhancement:** Allow users to select from multiple templates

**Implementation:**
```typescript
interface Template {
  owner: string;
  repo: string;
  name: string;
  description: string;
  preview: string;
}

const templates: Template[] = [
  {
    owner: "TMuse333",
    repo: "next-js-template",
    name: "Modern Business",
    description: "Clean, professional template for businesses",
    preview: "/templates/modern-business.png"
  },
  {
    owner: "TMuse333",
    repo: "portfolio-template",
    name: "Creative Portfolio",
    description: "Showcase your work beautifully",
    preview: "/templates/portfolio.png"
  }
];

// In deployment route
const template = templates.find(t => t.repo === templateName);
const repo = await octokit.repos.createUsingTemplate({
  template_owner: template.owner,
  template_repo: template.repo,
  // ...
});
```

---

### 15.2 Per-User API Keys

**Current:** All children share same API keys

**Enhancement:** Generate unique API keys per deployment

**Implementation:**
- OpenAI: Create organization projects per user
- MongoDB: Create isolated databases per user
- Vercel Blob: Create isolated stores per user

---

### 15.3 Automated Testing

**Add to Deployment Pipeline:**
1. Run Lighthouse tests on deployed site
2. Test all components render correctly
3. Validate websiteData.json schema
4. Check broken links
5. Test responsive design

**Report to Parent Dashboard:**
```
Performance Score: 95/100
Accessibility Score: 100/100
SEO Score: 90/100
```

---

### 15.4 Rollback & Version Control

**Enhancement:** Allow users to rollback to previous versions

**Implementation:**
- Store all `websiteData.json` versions in MongoDB
- Tag GitHub commits with version numbers
- Provide UI to select and restore previous versions

---

## 16. Support & Troubleshooting

### Debug Mode

**Enable Verbose Logging:**
```bash
# Parent .env
DEBUG=true
LOG_LEVEL=verbose
```

**Logs:**
- GitHub API requests/responses
- Vercel API requests/responses
- Component injection file counts
- Environment variable values (redacted)

### Contact

**Issues with Deployment:**
1. Check parent repo logs
2. Check Vercel deployment logs (child project)
3. Check GitHub Actions (if enabled)
4. Contact admin: `thomaslmusial@gmail.com`

---

## Summary

The parent repo (`easy-money`) is responsible for:

1. ✅ Creating GitHub repos from template
2. ✅ Injecting components and websiteData.json
3. ✅ Creating Vercel projects
4. ✅ Setting environment variables (`REPO_OWNER`, `REPO_NAME`, API keys)
5. ✅ Configuring custom domains
6. ⚠️ **CRITICAL FIX NEEDED:** Ensure `CURRENT_BRANCH` matches child template default

The child template (`next-js-template`) must:

1. ✅ Read `REPO_OWNER` and `REPO_NAME` from environment variables
2. ✅ Fetch websiteData.json from its OWN GitHub repo (not hardcoded)
3. ⚠️ **CRITICAL FIX NEEDED:** Update `src/lib/config.ts` to use env vars properly
4. ⚠️ **CRITICAL FIX NEEDED:** Remove hardcoded values from `src/lib/deploy/github-api-operations.ts`

---

**Next Steps:**
1. Review this document with the parent repo
2. Implement critical fixes in child template
3. Test full deployment pipeline
4. Update parent repo documentation with Vercel env var requirements
