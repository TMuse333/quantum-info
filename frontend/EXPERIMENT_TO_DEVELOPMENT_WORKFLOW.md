# Experiment → Development Workflow Implementation Plan

**Last Updated:** 2026-01-01
**Status:** Planning Phase

---

## 📋 Objectives Summary

1. **Make experiment branch match development's architecture** (GitHub API approach, not hardcoded data)
2. **Implement production filtering** from experiment → development
3. **Add build verification system** (dry-run capability before deploying/merging)
4. **Create smart merge script** that excludes design components and sample data
5. **Ensure development branch always passes `npm run build`**

---

## 🎯 Implementation Phases

### **Phase 1: Build Testing Infrastructure** ⭐ DO FIRST

Set up a way to verify builds before merging

#### Actions:
- [ ] Create a local build test script (`scripts/test-build.sh`)
- [ ] Set up Vercel CLI dry-run capability
- [ ] Add GitHub Actions workflow for automated build checks on experiment branch
- [ ] Document build testing process

#### Benefits:
- Catch build errors before they reach development
- Test production builds without actually deploying
- Automated safety net

#### Technical Approach:
```bash
# Local build verification
vercel build --prod  # Builds locally without deploying

# Alternative: Standard Next.js build
npm run build
```

#### Deliverables:
1. `scripts/test-build.sh` - Local build verification
2. `scripts/vercel-dry-run.sh` - Vercel production build test
3. `.github/workflows/experiment-build-check.yml` - Automated CI checks

---

### **Phase 2: Create Smart Merge Script** ⭐ CRITICAL FOR WORKFLOW

Automate the selective merge process

#### Actions:
- [ ] Create `scripts/merge-experiment-to-dev.sh` with the following logic:
  - Merge all structural/architectural changes from experiment
  - **EXCLUDE**: `src/components/designs/**/*` (except index files and new component structure)
  - **EXCLUDE**: `src/data/websiteData.json`
  - Run `npm run build` test before finalizing
  - Rollback merge if build fails
  - Show detailed diff summary before committing
  - Require manual confirmation before proceeding

#### Script Flow:
```
1. Verify on development branch
2. Ensure working directory is clean
3. Create backup branch (development-backup-TIMESTAMP)
4. Merge experiment branch
5. Restore excluded files from development:
   - git checkout development -- src/components/designs/
   - git checkout development -- src/data/websiteData.json
6. Run npm run build
7. If PASS → show diff, ask for confirmation, commit
8. If FAIL → abort merge, restore from backup
```

#### Benefits:
- Safe, repeatable merge process
- Prevents accidental sample data leakage
- Build verification built-in
- Easy rollback on failure

#### Deliverables:
1. `scripts/merge-experiment-to-dev.sh` - Main merge script
2. `MERGE_WORKFLOW.md` - Documentation on how to use the script

---

### **Phase 3: Sync Experiment → Development Architecture** 🔄 ONE-TIME MIGRATION

Make experiment branch use the same GitHub API approach as development

#### Current State:
- **Experiment**: Hardcoded sample data, populated componentMap
- **Development**: GitHub API injection, empty componentMap template

#### Target State:
- **Experiment**: Uses GitHub API approach, sample data in separate test folder
- **Development**: Unchanged (template ready for users)

#### Actions:
- [ ] Update experiment's `componentMap.tsx` to expect GitHub injection (match development)
- [ ] Move sample components to `src/components/designs/__TEST_DATA__/` or similar
- [ ] Create `src/data/__SAMPLE__/websiteData.json` for test data
- [ ] Update experiment's config to use GitHub API by default
- [ ] Add environment variable toggle for using sample data vs GitHub API
- [ ] Document how to use sample data for local testing

#### Migration Strategy:
```
Option A: Sample Data Toggle
- Add ENV variable: USE_SAMPLE_DATA=true (for experiment testing)
- Keep component structure but load from test folder when enabled

Option B: Separate Test Config
- Create test-websiteData.json
- Load based on environment
```

#### Benefits:
- Experiment branch becomes true testing ground for development
- Merges become cleaner with less divergence
- Easy to test new features with sample data
- No structural differences between branches

#### Deliverables:
1. Updated `componentMap.tsx` in experiment
2. `src/data/__SAMPLE__/` folder with test data
3. Environment configuration for toggling sample data
4. Documentation on testing with sample data

---

### **Phase 4: Port Production Filter** 📦 AFTER PHASE 3

Add production filtering to development branch

#### Actions:
- [ ] Copy `src/lib/deploy/production-filter.ts` from experiment → development
- [ ] Copy `scripts/test-production-filter.ts` from experiment → development
- [ ] Add filter integration to deployment scripts (if any)
- [ ] Test production filter with GitHub API approach
- [ ] Ensure filter works correctly when components are injected via API
- [ ] Document production filter usage

#### Integration Points:
- Deployment scripts
- Vercel configuration
- Build process (if needed)

#### Benefits:
- Prevents accidental deployment of editor/admin code
- Adds safety layer for production deployments
- Whitelist approach ensures only approved files are deployed

#### Deliverables:
1. `src/lib/deploy/production-filter.ts` in development
2. `scripts/test-production-filter.ts` in development
3. Integration documentation
4. Test coverage for filter rules

---

## 🚀 Immediate Next Steps (Priority Order)

### Step 1: Build Testing Infrastructure
**Why First?** Protects development branch immediately

**Tasks:**
1. Create Vercel dry-run build test script
2. Create local build verification script
3. Set up GitHub Actions workflow for experiment branch
4. Test all build verification methods

**Estimated Effort:** 1-2 hours

---

### Step 2: Smart Merge Script
**Why Second?** Enables safe experimentation workflow

**Tasks:**
1. Create merge script with exclusion logic
2. Add build verification to merge process
3. Add rollback capability
4. Test merge script on a test branch first
5. Document merge workflow

**Estimated Effort:** 2-3 hours

---

### Step 3: Architecture Sync (Experiment → Development)
**Why Third?** Reduces long-term maintenance burden

**Tasks:**
1. Design sample data structure for experiment
2. Update experiment to use GitHub API approach
3. Add environment toggle for sample data
4. Test that experiment works with both modes
5. Document testing workflow

**Estimated Effort:** 3-4 hours

---

### Step 4: Production Filter Integration
**Why Last?** Requires stable architecture first

**Tasks:**
1. Port production filter to development
2. Test filter with GitHub API injection
3. Verify filter rules match requirements
4. Document filter usage

**Estimated Effort:** 1-2 hours

---

## 📊 Success Criteria

### Phase 1 Success:
- ✅ Can run `npm run build` test without deploying
- ✅ Vercel dry-run works locally
- ✅ GitHub Actions checks experiment branch builds
- ✅ Build failures are caught before merge

### Phase 2 Success:
- ✅ Merge script successfully merges code changes
- ✅ Design components and sample data are excluded
- ✅ Build test runs automatically during merge
- ✅ Merge rolls back on build failure
- ✅ Manual confirmation required before finalizing

### Phase 3 Success:
- ✅ Experiment branch uses GitHub API approach
- ✅ Sample data available for testing via toggle
- ✅ No structural differences between experiment and development
- ✅ Merges are clean without conflicts

### Phase 4 Success:
- ✅ Production filter works in development branch
- ✅ Filter correctly handles GitHub API injection
- ✅ Test suite validates filter rules
- ✅ Documentation complete

---

## 🔧 Technical Details

### Vercel Dry-Run Approach
```bash
# Option 1: Vercel CLI local build
vercel build --prod

# Option 2: Standard Next.js build
npm run build

# Option 3: Vercel deployment preview (creates preview but not production)
vercel --prod --confirm=false  # Requires confirmation, prevents auto-deploy
```

### Merge Script Pseudocode
```bash
#!/bin/bash
# merge-experiment-to-dev.sh

# 1. Verify on development branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "development" ]; then
  echo "Error: Must be on development branch"
  exit 1
fi

# 2. Ensure clean working directory
if ! git diff-index --quiet HEAD --; then
  echo "Error: Working directory has uncommitted changes"
  exit 1
fi

# 3. Create backup
BACKUP_BRANCH="development-backup-$(date +%Y%m%d-%H%M%S)"
git branch $BACKUP_BRANCH
echo "Created backup branch: $BACKUP_BRANCH"

# 4. Merge experiment
git merge experiment --no-commit --no-ff

# 5. Restore excluded files
git checkout development -- src/components/designs/
git checkout development -- src/data/websiteData.json

# 6. Run build test
npm run build
BUILD_EXIT_CODE=$?

# 7. Handle result
if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "❌ Build failed! Aborting merge..."
  git merge --abort
  exit 1
else
  echo "✅ Build passed!"
  git diff --stat
  read -p "Commit merge? (y/n) " -n 1 -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "Merge experiment to development (excluding designs and sample data)"
  else
    git merge --abort
  fi
fi
```

### Sample Data Toggle Approach
```typescript
// src/lib/config.ts
export const USE_SAMPLE_DATA = process.env.USE_SAMPLE_DATA === 'true';

// src/data/index.ts
import productionData from './websiteData.json';
import sampleData from './__SAMPLE__/websiteData.json';

export const websiteData = USE_SAMPLE_DATA ? sampleData : productionData;
```

---

## 📝 Notes and Considerations

### Build Testing:
- Vercel CLI requires authentication (one-time setup)
- GitHub Actions requires secrets configuration for private repos
- Local builds should match production builds exactly

### Merge Strategy:
- Always create backup branch before merge
- Consider using `git merge --strategy-option` for complex scenarios
- Manual review of diff is critical before finalizing

### Architecture Alignment:
- Experiment should mirror development as closely as possible
- Sample data should be clearly marked and easy to exclude
- Environment variables should control testing behavior

### Production Filter:
- Filter must be updated when new features are added
- Whitelist approach is safer than blacklist
- Test filter rules regularly

---

## 🎯 Current Status

- [ ] Phase 1: Build Testing Infrastructure - **NOT STARTED**
- [ ] Phase 2: Smart Merge Script - **NOT STARTED**
- [ ] Phase 3: Architecture Sync - **NOT STARTED**
- [ ] Phase 4: Production Filter Integration - **NOT STARTED**

---

## 📚 Related Documentation

- `PRODUCTION_FILTER_GUIDE.md` - Production filter implementation (experiment branch)
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment workflow (experiment branch)
- `MERGE_WORKFLOW.md` - To be created in Phase 2

---

## 🤝 Next Actions

**Immediate:**
1. Review this plan
2. Confirm approach for each phase
3. Start with Phase 1 implementation

**Questions to Answer:**
- Should experiment branch always use GitHub API, or keep sample data toggle?
- What's the preferred Vercel dry-run method?
- Should merge script be fully automated or require manual confirmation?
- Are there other files/folders that should be excluded from merges?
