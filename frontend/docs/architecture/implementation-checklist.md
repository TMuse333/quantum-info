# Implementation Checklist

Quick reference for implementing multi-tenant deployment

---

## Phase 1: Template Repo (Week 1)

### Day 1-2: Clean Template
- [ ] Remove all user-specific data from current repo
- [ ] Create `.env.template` with all required variables
- [ ] Add `SETUP.md` with step-by-step instructions
- [ ] Test clean install works

### Day 3-4: Automation Scripts
- [ ] `scripts/create-user-repo.sh` - Clone template for new user
- [ ] `scripts/setup-github.sh` - Configure GitHub webhooks
- [ ] `scripts/setup-vercel.sh` - Create Vercel projects
- [ ] Test scripts on test user

### Day 5: Documentation
- [ ] Document template structure
- [ ] Document required GitHub permissions
- [ ] Document Vercel setup process
- [ ] Create troubleshooting guide

---

## Phase 2: Vercel API (Week 2-3)

### Day 1-2: Vercel SDK Setup
```bash
npm install @vercel/client
```

- [x] Create Vercel team/account for your company
- [x] Generate Vercel API token
- [ ] Test authentication
- [ ] Create test project via API

### Day 3-5: Development Editor Deployment
- [x] Build `deployEditor()` function
- [x] Build `vercel-client.ts` wrapper
- [x] Add API route `/api/vercel/deploy-editor`
- [ ] Test editor deployment to Vercel
- [ ] Configure custom domain (dev subdomain)
- [ ] Test editor loads correctly
- [ ] Verify GitHub sync works

### Day 6-7: Production Deployment
- [x] Build `deployProduction()` function
- [x] Add Claude Code validation placeholder
- [x] Add API route `/api/vercel/deploy-production`
- [x] Create integration documentation
- [ ] Test production deployment
- [ ] Add deployment status tracking
- [ ] Test custom domain assignment
- [ ] Verify production site works
- [ ] Update deployment modal UI

---

## Phase 3: Build Validation (Week 4)

### Day 1-2: Basic Validation
- [ ] Install dependencies for validation
  ```bash
  npm install simple-git execa
  ```
- [ ] Build `validateBuild()` function
- [ ] Test on known-good build
- [ ] Test on build with errors
- [ ] Parse error messages correctly

### Day 3-4: Claude Code Integration
- [ ] Set up Claude API credentials
- [ ] Build `fixBuildErrors()` function
- [ ] Test with TypeScript errors
- [ ] Test with ESLint errors
- [ ] Test with syntax errors
- [ ] Measure success rate

### Day 5: Integration
- [ ] Add validation to deployment flow
- [ ] Show validation progress in modal
- [ ] Handle validation failures
- [ ] Add retry logic
- [ ] Test end-to-end

---

## Phase 4: User Onboarding (Week 5)

### Backend API Routes
- [ ] `POST /api/admin/users/create`
- [ ] `POST /api/admin/repos/create`
- [ ] `POST /api/admin/vercel/setup-dev`
- [ ] `POST /api/admin/vercel/setup-prod`
- [ ] `GET /api/admin/users/:id/status`

### Frontend Onboarding Flow
- [ ] Create signup form
- [ ] Show setup progress
- [ ] Send welcome email with links
- [ ] Test happy path
- [ ] Test error cases

---

## Quick Start Commands

### Create new user
```bash
# 1. Clone template repo
./scripts/create-user-repo.sh client1

# 2. Setup Vercel projects
./scripts/setup-vercel.sh client1

# 3. Deploy dev editor
npm run deploy:editor -- --user=client1

# 4. User is ready!
```

### Deploy production
```bash
# From editor UI or via API
POST /api/production/deploy-vercel
{
  "userId": "client1",
  "validateBuild": true,
  "autoFix": true
}
```

---

## Testing Checklist

Before going live:

### Template Testing
- [ ] Fresh template clone works
- [ ] All env vars documented
- [ ] Editor loads successfully
- [ ] Can create/edit components
- [ ] Can save to GitHub
- [ ] Can deploy to production

### Build Validation
- [ ] Catches TypeScript errors
- [ ] Catches ESLint errors
- [ ] Catches syntax errors
- [ ] Auto-fix works 70%+ of time
- [ ] Shows clear error messages
- [ ] Doesn't timeout

### Deployment
- [ ] Dev editor deploys < 2 min
- [ ] Production deploys < 3 min
- [ ] Custom domains work
- [ ] SSL certificates auto-provision
- [ ] Rollback works

### User Experience
- [ ] Onboarding < 5 min
- [ ] Clear progress indicators
- [ ] Helpful error messages
- [ ] Can recover from failures
- [ ] Documentation is clear

---

## Environment Variables Reference

### Template Repo (per user)
```env
# GitHub
GITHUB_TOKEN=<user's personal access token>
GITHUB_OWNER=yourcompany
GITHUB_REPO=<userId>-website
NEXT_PUBLIC_REPO_TYPE=monorepo

# User Info
NEXT_PUBLIC_USER_ID=<userId>

# Shared Services (same for all)
NEXT_PUBLIC_CLAUDE_API_KEY=<your shared key>
VERCEL_TOKEN=<your vercel token>
```

### Backend (admin)
```env
# GitHub (app token for automation)
GITHUB_APP_TOKEN=<app installation token>

# Vercel
VERCEL_TOKEN=<team token>
VERCEL_TEAM_ID=<your team id>

# Claude
ANTHROPIC_API_KEY=<your key>

# Database
DATABASE_URL=<for user management>
```

---

## File Structure After Implementation

```
next-js-template/
├── scripts/
│   ├── create-user-repo.sh
│   ├── setup-github.sh
│   ├── setup-vercel.sh
│   └── update-template.sh
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── users/create/route.ts
│   │       │   ├── repos/create/route.ts
│   │       │   └── vercel/setup/route.ts
│   │       └── production/
│   │           ├── deploy-vercel/route.ts
│   │           └── validate-build/route.ts
│   └── lib/
│       ├── vercel/
│       │   ├── deploy-editor.ts
│       │   └── deploy-production.ts
│       └── build/
│           ├── validate-build.ts
│           └── claude-auto-fix.ts
└── docs/
    └── architecture/
        ├── multi-tenant-deployment-plan.md
        └── implementation-checklist.md (this file)
```

---

## Cost Tracking

Per user/month:
- GitHub private repo: $4
- Vercel (average): $2-5
- Claude API (deployments): $1-2
- **Total:** ~$7-11/user/month

Scale costs:
- 10 users: ~$70-110/month
- 100 users: ~$700-1100/month
- 1000 users: ~$7000-11000/month

---

## Success Criteria

MVP is ready when:
- [✅] 3 test users onboarded successfully
- [✅] All deployments succeed
- [✅] Build validation works
- [✅] Auto-fix solves 70%+ errors
- [✅] Average deployment < 3 min
- [✅] Documentation complete
- [✅] No critical bugs

---

**Next Action:** Start Week 1, Day 1 - Clean template repo
