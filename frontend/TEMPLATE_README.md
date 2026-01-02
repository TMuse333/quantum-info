# Next.js Website Builder & Editor - Frontend Template

## Overview

This is a Next.js 16 website builder and editor that allows users to create, customize, and deploy websites through a visual interface. The system includes:

- **Visual Website Editor** - Drag-and-drop interface for building pages
- **Dashboard** - Deployment management and version control
- **AI Assistant** - Chatbot for helping users customize their sites
- **Automated Deployment** - GitHub + Vercel integration with versioning
- **Production Snapshots** - Version history with rollback capability

This `development` branch contains a **clean template** ready for SaaS deployment - all user data and production components have been removed.

## Tech Stack

- **Next.js**: 16.1.0 (App Router)
- **React**: 19.1.0
- **Node.js**: 20.18.0 (via nvm)
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x
- **Framer Motion**: 12.x (animations)
- **Zustand**: 5.x (state management)

---

## Current State (Development Branch)

### ✅ What's Included:

**Core Editor Components:**
- `src/components/editor/` - Visual editor interface (component editor, sidebar, panels)
- `src/components/dashboard/` - Deployment dashboard and history
- `src/components/deployment/` - Deployment modals and progress UI
- `src/components/chatbot/` - AI website assistant

**Deployment System:**
- 6-stage deployment pipeline with production snapshots
- GitHub API integration for automated commits
- Vercel API integration (partial - first deploy only)
- Server-Sent Events (SSE) for real-time deployment progress
- Preview data files before deploying

**Version Control:**
- Production snapshot system (versioned JSON backups)
- `.data.ts` file regeneration from snapshots
- Deployment history tracking

**API Routes:**
- `/api/production/push-to-main` - Main deployment pipeline
- `/api/production/preview-data-files` - Preview generated files
- `/api/production/check-first-deploy` - Detect first vs subsequent deploys
- `/api/production/deployment-history` - Fetch deployment records
- `/api/assistant/*` - AI assistant endpoints

### ❌ What's Been Removed (Clean Template):

- All production components (`designs/` folder)
- All page components (`pageComponents/` folder)
- User-specific data from `websiteData.json`
- Production snapshots (folder exists but empty)
- Development documentation and test files
- API keys and tokens from `.env` files

---

## Core Features

### 1. Website Editor
- Visual component editor with real-time preview
- Color theme customization
- Text and content editing
- SEO metadata management
- Page creation and management

### 2. Deployment System

**6-Stage Pipeline:**
1. **Validation** - Check GitHub/Vercel configuration
2. **Component Copy** - Copy production components to main branch
3. **File Generation** - Generate `.data.ts` files from websiteData
4. **GitHub Push** - Commit and push to main branch
5. **Snapshot Creation** - Save production snapshot as `v{N}.json`
6. **Data File Sync** - Regenerate `.data.ts` from snapshot (ensures consistency)

**Key Innovation:** Stage 6 ensures `.data.ts` files are regenerated FROM the production snapshot, creating a "round-trip verification" where snapshots are the source of truth.

### 3. Production Snapshots

Snapshots store complete website state:
```json
{
  "version": 1,
  "timestamp": "2024-12-26T12:00:00.000Z",
  "websiteData": { /* complete website configuration */ },
  "metadata": {
    "deploymentId": "...",
    "commitSha": "...",
    "vercelUrl": "..."
  }
}
```

Stored in `frontend/production-snapshots/v{N}.json` on main branch.

### 4. Smart Deployment Detection

**First Deploy:**
- Uses Vercel API to create project
- Full GitHub + Vercel setup
- Creates initial production snapshot

**Subsequent Deploys:**
- GitHub push only (faster)
- Auto-increments version number
- Uses `[vercel skip]` commit message to prevent duplicate deployments

The system automatically detects which method to use via `/api/production/check-first-deploy`.

---

## File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── production/          # Deployment APIs
│   │   │   │   ├── push-to-main/
│   │   │   │   ├── preview-data-files/
│   │   │   │   ├── check-first-deploy/
│   │   │   │   └── deployment-history/
│   │   │   └── assistant/           # AI assistant APIs
│   │   ├── dashboard/               # Dashboard page
│   │   └── page.tsx                 # Editor page (root)
│   │
│   ├── components/
│   │   ├── editor/                  # Editor UI components
│   │   ├── dashboard/               # Dashboard UI
│   │   ├── deployment/              # Deployment modals
│   │   ├── chatbot/                 # AI assistant
│   │   └── providers/               # React context providers
│   │
│   ├── lib/
│   │   ├── deploy/
│   │   │   └── github-api-operations.ts  # Core deployment logic
│   │   ├── generators/
│   │   │   └── generatePageFiles.ts      # .data.ts generation
│   │   └── hooks/                   # React hooks
│   │
│   ├── stores/                      # Zustand state management
│   ├── types/
│   │   ├── index.ts                 # Production types (minimal)
│   │   └── editorial.ts             # Editor types (all types)
│   │
│   └── data/
│       └── websiteData.json         # Website configuration (blank template)
│
├── production-snapshots/            # Production version history
├── docs/                            # Architecture & deployment docs
├── SAAS_DEPLOYMENT_WORKFLOW.md      # SaaS implementation plan
└── TEMPLATE_README.md               # This file
```

---

## Required Environment Variables

Create `.env` and `.env.local` files with:

```bash
# Repository Configuration
NEXT_PUBLIC_REPO_TYPE=monorepo

# GitHub API (for automated commits)
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_github_username
GITHUB_API_KEY=your_github_api_key

# Vercel API (for deployments)
VERCEL_API_TOKEN=your_vercel_token

# AI Assistant
OPENAI_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database (for user management - future)
MONGODB_URI=your_mongodb_connection_string

# Vector Database (for AI knowledge base)
QDRANT_API_KEY=your_qdrant_key
QDRANT_URL=your_qdrant_url

# Neural Network (custom ML features)
NEURAL_NETWORK_URL=your_neural_network_url

# User Configuration
USER_EMAIL=your_email

# Vercel Blob Storage (for media)
BLOB=your_blob_token
BLOB_READ_WRITE_TOKEN=your_blob_rw_token
```

**Critical for Deployment:**
- `GITHUB_TOKEN` - Personal access token with `repo` scope
- `VERCEL_API_TOKEN` - Vercel API token
- `GITHUB_USERNAME` - GitHub account username

---

## Key Dependencies

### Deployment & APIs
- `@octokit/rest` - GitHub API client
- `eventsource-parser` - SSE parsing for Vercel API

### UI & Animation
- `framer-motion` - Component animations
- `lucide-react` - Icon library
- `tailwindcss` - Styling

### State Management
- `zustand` - Global state management
- React Context - Component-level state

### AI & ML
- `openai` - OpenAI API client
- `@anthropic-ai/sdk` - Claude API client
- `@qdrant/js-client-rest` - Vector database

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env` and add your API keys as listed above.

### 3. Configure GitHub Repository
The system needs to push to a GitHub repository. Update these in your deployment code or environment:
- `GITHUB_OWNER` - Your GitHub username/org
- `GITHUB_REPO` - Repository name
- `PRODUCTION_BRANCH` - Usually `main`

### 4. Run Development Server
```bash
npm run dev
```

Access at `http://localhost:3000`

### 5. First Deployment Setup
1. Create a blank GitHub repository
2. Configure Vercel project (or let the system create it)
3. Update `src/data/websiteData.json` with your repo info:
```json
{
  "deployment": {
    "githubOwner": "your-username",
    "githubRepo": "your-repo-name"
  }
}
```

---

## API Endpoints

### Deployment APIs

#### `POST /api/production/push-to-main`
Main deployment pipeline - executes 6-stage deployment process.

**Body:**
```json
{
  "websiteData": { /* website configuration */ },
  "dryRun": false
}
```

**Response:** Server-Sent Events stream with stage updates

#### `POST /api/production/preview-data-files`
Preview generated `.data.ts` files before deploying.

**Body:**
```json
{
  "websiteData": { /* website configuration */ }
}
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "path": "src/app/index.data.ts",
      "content": "export const data = {...}",
      "size": 1234
    }
  ]
}
```

#### `GET /api/production/check-first-deploy`
Checks if this is the first deployment.

**Response:**
```json
{
  "isFirstDeploy": false,
  "latestVersion": 3
}
```

#### `GET /api/production/deployment-history`
Fetches deployment history from production snapshots.

**Response:**
```json
{
  "deployments": [
    {
      "version": 1,
      "timestamp": "2024-12-26T12:00:00.000Z",
      "status": "success",
      "url": "https://...",
      "commitSha": "abc123"
    }
  ]
}
```

---

## Type System

The project uses a split type system:

### Production Types (`@/types`)
**Purpose:** Minimal types for production builds (smaller bundle)

**Exports:**
- `colors`
- `componentTypes`
- `forms`
- `navbar`

**Usage:** Production code imports from `@/types`

### Editorial Types (`@/types/editorial`)
**Purpose:** All types including editor-specific types

**Exports:**
- All production types (re-exported)
- `helperBot`
- `llmOutputs`
- `templateTypes`
- `usage`
- `user`
- `website`
- `registry/mainRegistry`

**Usage:** Editor code imports from `@/types/editorial`

This prevents editor-only types from bloating the production bundle.

### Why Two Type Files?

**The Problem:** The editor needs types that should never exist in production deployments.

**Examples of Editorial-Only Types:**
- `helperBot` - AI assistant types (not needed in deployed sites)
- `user` - User management types (editor-only)
- `llmOutputs` - LLM response types (editor-only)
- `templateTypes` - Template configuration (editor-only)

**Why This Matters:**
- These types would bloat the production bundle
- They expose editor implementation details
- They're not pushed to the main branch (production)
- They're only needed during the editing/building process

**Architecture Decision:**
The `types/` folder structure (`index.ts` for production, `editorial.ts` for editor) should be replicated in the parent application for consistency. This ensures a clean separation between:
1. **Production types** - What users' deployed sites need
2. **Editorial types** - What the editor/builder needs

**Import Pattern:**
```typescript
// In production components (pushed to main branch)
import { ComponentProps } from '@/types'

// In editor components (never pushed to main)
import { WebsiteData, UserProfile } from '@/types/editorial'
```

---

## Component Architecture: Edit vs Production Versions

This template uses a **dual-component architecture** where each component has two versions:

### 1. Edit Components (Template/Editor Mode)
**Location:** Parent repository (editor codebase)

**Characteristics:**
- ✅ **No mandatory props** - All props are optional
- ✅ **Fallback data** - Components render with default/placeholder data
- ✅ **Null checks** - Defensive programming for missing data
- ✅ **Template-friendly** - Works out-of-the-box with empty data

**Purpose:** Allow users to add components to their pages without errors, even before customizing them.

**Example (Edit Mode):**
```typescript
interface HeroEditProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export function HeroEdit({
  title = "Your Title Here",
  subtitle = "Add your subtitle",
  imageUrl = "/placeholder.jpg"
}: HeroEditProps) {
  return (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      <img src={imageUrl} alt={title || "Hero"} />
    </div>
  )
}
```

**Benefits:**
- Users can drag-and-drop components without crashes
- Templates work immediately with sensible defaults
- Graceful degradation if data is missing

---

### 2. Production Components (Deployed Sites)
**Location:** Generated and pushed to main branch

**Characteristics:**
- ❌ **All props mandatory** - No optional props
- ❌ **No fallbacks** - Expects real data
- ❌ **No null checks** - Assumes data is always present
- ✅ **Type-safe** - Strict TypeScript enforcement
- ✅ **Optimized** - Smaller bundle, no defensive code

**Purpose:** Production sites have real data from `websiteData.json` - no need for fallbacks or null checks.

**Example (Production Mode):**
```typescript
interface HeroProductionProps {
  title: string;        // Required!
  subtitle: string;     // Required!
  imageUrl: string;     // Required!
}

export function HeroProduction({
  title,
  subtitle,
  imageUrl
}: HeroProductionProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <img src={imageUrl} alt={title} />
    </div>
  )
}
```

**Benefits:**
- Cleaner code without defensive programming
- Smaller bundle size (no fallback logic)
- Faster runtime (no null checks)
- Type safety ensures data integrity

---

### Component Transformation Flow

```
1. User adds component in editor
   ↓
2. Component renders with EDIT version (fallback data)
   ↓
3. User customizes props through editor UI
   ↓
4. Data saved to websiteData.json
   ↓
5. User clicks "Deploy"
   ↓
6. System generates PRODUCTION version
   ↓
7. Production component pushed to main branch
   ↓
8. Vercel builds with real data (no fallbacks needed)
```

---

### File Naming Convention

**In Parent Repository (Editor):**
```
src/components/designs/
├── hero/
│   ├── heroEdit.tsx          # Edit version (optional props, fallbacks)
│   ├── hero.prod.tsx         # Production template (mandatory props)
│   └── index.ts              # Exports for editor
```

**Generated for User Repos (Production):**
```
src/components/
└── hero/
    └── hero.tsx              # Production version only
```

---

### Why This Architecture?

**Problem:** If we used the same component for both modes:
- Production sites would include unnecessary fallback logic
- Bundle size would increase
- Runtime performance would decrease
- OR: Templates would crash without data

**Solution:** Two versions optimized for their use case:
- **Edit components** are forgiving and template-friendly
- **Production components** are strict and optimized

---

### Parent Application Considerations

**Recommendation:** The parent application should adopt this same pattern:

1. **Maintain both versions** of each component
2. **Edit components** (`componentEdit.tsx`) for the builder interface
3. **Production templates** (`component.prod.tsx`) for generation
4. **Transform during deployment** - Convert edit → production during the push-to-main process
5. **Use consistent naming** - `Edit` suffix for editor, `.prod` suffix for production templates

**Example Parent Repo Structure:**
```
parent-app/
├── src/
│   ├── components/
│   │   ├── designs/              # Edit versions (with fallbacks)
│   │   │   ├── hero/
│   │   │   │   ├── heroEdit.tsx
│   │   │   │   └── hero.prod.tsx
│   │   │   └── testimonials/
│   │   │       ├── testimonialsEdit.tsx
│   │   │       └── testimonials.prod.tsx
│   │   │
│   │   └── editor/               # Editor UI components
│   │
│   └── types/
│       ├── index.ts              # Production types
│       └── editorial.ts          # Editor-only types
```

This maintains consistency between the parent application and this template repository.

---

## SaaS Integration Strategy

### Current State: Single-User Template
This template is configured for one user to manage their website.

### SaaS Vision: Multi-Tenant Platform

**Phase 1: Template Preparation** ✅ COMPLETE
- Clean development branch (no user data)
- Blank `websiteData.json`
- Empty production snapshots

**Phase 2: GitHub API Integration** 🚧 TODO
- Create repos from template automatically
- API endpoint: `POST /api/github/create-repo`
- Use GitHub's template repository feature
- Initialize with blank websiteData

**Phase 3: Vercel API Integration** 🚧 PARTIAL
- Automatically create Vercel projects for users
- Currently works for first deploy only
- Need to expand for multi-user management

**Phase 4: User Management** 🚧 TODO
- MongoDB user database
- Link users to their GitHub repos
- Store deployment credentials per user
- Multi-tenancy support

**Phase 5: Onboarding Flow** 🚧 TODO
1. User signs up
2. System creates GitHub repo from template
3. System creates Vercel project
4. User selects template (future: multiple templates)
5. User customizes and deploys

**Phase 6: Dashboard Enhancements** 🚧 TODO
- Multi-website management per user
- Usage analytics
- Billing integration
- Custom domain management

See `SAAS_DEPLOYMENT_WORKFLOW.md` for detailed implementation plan.

---

## Deployment Architecture Deep Dive

### How .data.ts Files Work

The system generates TypeScript data files that production sites import:

**Input:** `websiteData.json`
```json
{
  "pages": {
    "index": {
      "components": [
        {
          "type": "hero",
          "props": { "title": "Hello World" }
        }
      ]
    }
  }
}
```

**Output:** `src/app/index.data.ts`
```typescript
export const data = {
  components: [
    {
      type: 'hero',
      props: { title: 'Hello World' }
    }
  ]
}
```

**Why?** TypeScript files allow type-checking and better IDE support in production code.

### Snapshot Sync Flow

```
1. User edits website in editor
   ↓
2. Click "Push to Main"
   ↓
3. Generate .data.ts from in-memory websiteData
   ↓
4. Push to GitHub
   ↓
5. Save snapshot to production branch
   ↓
6. Regenerate .data.ts FROM snapshot
   ↓
7. Push regenerated files
   ↓
8. Vercel auto-deploys (triggered by main branch push)
```

**Stage 6 is critical** - ensures production files exactly match the snapshot.

### Why Two Commits?

1. **First commit:** Initial push with generated files
2. **Second commit:** Snapshot save + data file regeneration

Both use `[vercel skip]` to prevent triggering Vercel. Only the initial push to main (without skip) triggers deployment.

---

## Known Limitations

### Template System
- Only blank template available
- No pre-built templates yet (planned)
- Component library is minimal

### Deployment
- Vercel API only used for first deploy
- Subsequent deploys use GitHub push (Vercel auto-detects)
- No custom domain automation yet
- No deployment rollback UI (snapshots exist but no UI)

### Multi-Tenancy
- Single-user system currently
- No user authentication
- No multi-website management
- Hardcoded GitHub repo configuration

### AI Assistant
- Basic functionality only
- Limited to color/text updates
- No component generation yet

### Component Library
- Very limited components available
- Most production components were removed for template
- Need to build component marketplace

---

## Next Steps for Full SaaS

### Immediate (MVP)
1. **GitHub Template Repo Setup**
   - Make this a GitHub template repository
   - API to create repos from template

2. **User Authentication**
   - Clerk/Auth0/NextAuth integration
   - User database schema

3. **Multi-Tenancy**
   - Store GitHub credentials per user
   - Support multiple websites per user

### Short Term
4. **Vercel API Expansion**
   - Full Vercel project management
   - Custom domain automation

5. **Component Library**
   - Add 10-20 production-ready components
   - Component marketplace

6. **Template System**
   - Create 5+ starter templates
   - Template selection on signup

### Long Term
7. **Billing & Plans**
   - Stripe integration
   - Usage-based pricing

8. **Advanced Features**
   - Form builder
   - E-commerce components
   - Analytics integration
   - SEO tools

9. **White Label**
   - Allow agencies to rebrand
   - Custom domain for builder itself

---

## Editor Migration Challenge

### Critical Issue: Editor Divergence

**Background:**
The original website editor was built in the parent application. When creating this template repository, the editor was migrated and **significantly modified** with:
- New features and capabilities
- Updated state management (new Zustand stores)
- Refactored component structure
- Enhanced deployment integration
- Improved UI/UX

**The Problem:**
The parent application still has the old editor, but **users need access to this improved editor** to build their websites. The two codebases have now diverged significantly, creating a migration challenge.

---

### Current State

**Parent App Editor (Old):**
- Original editor implementation
- May have different stores
- Potentially missing new features
- Different component organization

**Template Repo Editor (New):**
- Located in `src/components/editor/` (single folder ✅)
- Heavily modified and enhanced
- New Zustand stores
- Updated deployment workflows
- Improved component editor

**Key Advantage:**
The editor components are consolidated in a **single folder** (`src/components/editor/`), which should simplify migration.

---

### Why This Matters

**User Requirement:**
Users must be able to access and use the editor from the parent application to:
1. Build their websites
2. Customize components
3. Manage deployments
4. Use the AI assistant

**Current Gap:**
- Parent app has outdated editor
- Template has improved editor
- No clear sync mechanism between them

---

### Migration Strategy (TBD)

**The exact migration strategy is not yet determined**, but here are potential approaches:

#### Option 1: Sync Editor Back to Parent
**Approach:** Copy the enhanced editor from this template back to the parent app.

**Process:**
1. Copy entire `src/components/editor/` folder to parent
2. Migrate Zustand stores to parent app
3. Update parent app dependencies
4. Test editor functionality in parent context
5. Resolve conflicts with parent app architecture

**Pros:**
- Parent app gets all improvements
- Users access editor from parent directly
- Single source of truth for editor

**Cons:**
- May conflict with parent app structure
- Need to maintain editor in two places
- Potential merge conflicts on future updates

---

#### Option 2: Editor as Shared Package
**Approach:** Extract editor into a shared npm package used by both repos.

**Process:**
1. Create `@yourorg/website-editor` package
2. Extract `src/components/editor/`
3. Publish to npm or private registry
4. Both parent and template import from package
5. Update package when editor changes

**Pros:**
- Single source of truth
- Consistent editor across both apps
- Easier to update and maintain
- Version control for editor changes

**Cons:**
- Additional complexity
- Need to manage package publishing
- May require significant refactoring

---

#### Option 3: Embedded Editor in Parent
**Approach:** Parent app embeds this template's editor via iframe or micro-frontend.

**Process:**
1. Host editor as standalone app
2. Parent app embeds via iframe/micro-frontend
3. Communication via postMessage or shared state
4. Editor remains in template repo

**Pros:**
- No code duplication
- Editor stays in one place
- Easy to update independently

**Cons:**
- Complex communication layer
- Potential performance issues
- Iframe limitations

---

#### Option 4: Git Subtree/Submodule
**Approach:** Use Git subtree or submodule to share editor code.

**Process:**
1. Define editor as Git subtree/submodule
2. Parent app imports from subtree
3. Changes sync between repos
4. Maintain single editor codebase

**Pros:**
- Git-native solution
- Shared codebase
- Version tracking

**Cons:**
- Git subtrees/submodules can be complex
- Merge conflicts
- Learning curve for team

---

### Recommended Next Steps

1. **Audit the Differences**
   - Compare parent app editor vs template editor
   - Document all changes, new features, new stores
   - Identify breaking changes
   - Map dependencies

2. **Choose Migration Strategy**
   - Evaluate options based on team size, timeline, complexity
   - Consider long-term maintenance
   - Align with overall architecture goals

3. **Create Migration Plan**
   - Step-by-step migration process
   - Testing strategy
   - Rollback plan if issues arise

4. **Execute Migration**
   - Implement chosen strategy
   - Test thoroughly in parent app
   - Ensure users can access editor

5. **Establish Sync Process**
   - Define how future editor updates propagate
   - Version control strategy
   - Communication between teams

---

### Key Considerations

**For Parent App:**
- Must provide users with access to the improved editor
- May need to refactor to accommodate new stores/architecture
- Should align folder structure with template (`src/components/editor/`)

**For Template:**
- Editor should remain functional in template context
- Must be extractable/portable for migration
- Document all editor dependencies clearly

**For Both:**
- Establish clear ownership of editor code
- Define update/sync process
- Maintain consistency in user experience

---

### Dependencies to Migrate

When migrating the editor, these will likely need to move with it:

**Zustand Stores:**
- Check `src/stores/` for editor-related state
- May include: componentStore, websiteStore, deploymentStore

**Editor Components:**
- `src/components/editor/` (entire folder)
- Any shared UI components used by editor

**Types:**
- `src/types/editorial.ts` (editor-specific types)
- Component type definitions

**APIs:**
- `/api/assistant/*` (AI assistant endpoints)
- Any editor-specific API routes

**Utilities:**
- Helper functions used by editor
- Validation logic
- Data transformation utilities

---

### Timeline & Priority

**Priority:** 🔴 **CRITICAL**

This migration must be resolved before:
- Launching SaaS platform
- Onboarding real users
- Scaling to multiple users

**Estimated Complexity:** HIGH

**Recommended Timeline:**
- Audit differences: [TBD]
- Choose strategy: [TBD]
- Execute migration: [TBD]
- Testing & validation: [TBD]

**Status:** ⚠️ **NOT YET STARTED**

---

## Integration with Parent Project

### How This Fits In

This frontend is designed to be:

1. **Standalone Development Environment**
   - Can run independently for development
   - All features testable locally

2. **Template for User Repos**
   - Parent project creates copies of this
   - Each user gets their own repo

3. **Shared Codebase**
   - Parent project can update template
   - Users get updates via template sync

### Expected Parent Project Responsibilities

1. **User Management**
   - Authentication
   - User database
   - Subscription/billing

2. **Repo Creation**
   - GitHub API to create user repos
   - Initialize from this template
   - Set up GitHub secrets/tokens

3. **Vercel Integration**
   - Create Vercel projects
   - Manage deployments
   - Custom domains

4. **Dashboard**
   - Multi-website management
   - Analytics aggregation
   - Billing interface

### Communication Between Systems

**Option 1: Shared Database**
- Parent and template share MongoDB
- Template writes deployment history
- Parent reads for dashboard

**Option 2: API Communication**
- Template calls parent APIs
- Parent manages all persistence
- Template is purely UI + deployment

**Option 3: Webhook Integration**
- Template sends webhooks on events
- Parent listens and updates database
- Loose coupling

---

## Development Workflow

### Making Changes to Template

1. **Work on `development` branch**
   - All template changes here
   - Keep clean (no user data)

2. **Test on `experiment` branch**
   - Create test deployments
   - Add user data for testing
   - Don't merge to development

3. **Update Documentation**
   - Update this file
   - Update `SAAS_DEPLOYMENT_WORKFLOW.md`
   - Add to `docs/` as needed

4. **Commit Template Updates**
   - Clear commit messages
   - Reference issues/features
   - Keep development clean

### Testing Deployment System

Use `dryRun` mode:
```typescript
await fetch('/api/production/push-to-main', {
  method: 'POST',
  body: JSON.stringify({
    websiteData: data,
    dryRun: true  // No actual commits
  })
})
```

This simulates deployment without pushing to GitHub.

---

## Support & Documentation

### Additional Documentation

- `docs/architecture/` - System architecture details
- `docs/deployment/` - Deployment system guides
- `docs/components/` - Component documentation
- `docs/version-control/` - Version control system
- `SAAS_DEPLOYMENT_WORKFLOW.md` - SaaS implementation roadmap

### Key Files to Understand

1. **`src/lib/deploy/github-api-operations.ts`**
   - All GitHub API operations
   - Deployment logic
   - Snapshot management

2. **`src/app/api/production/push-to-main/route.ts`**
   - 6-stage pipeline orchestration
   - SSE streaming
   - Error handling

3. **`src/lib/generators/generatePageFiles.ts`**
   - .data.ts file generation
   - Component transformation
   - Type generation

4. **`src/components/editor/dashboard/deployPanel.tsx`**
   - Deployment UI
   - Smart deploy logic
   - User interaction

---

## Contributing

When contributing to this template:

1. **Keep Development Branch Clean**
   - No user data
   - No API keys
   - No production snapshots

2. **Test Thoroughly**
   - Use experiment branch for testing
   - Test both first deploy and updates
   - Verify snapshot regeneration

3. **Document Changes**
   - Update this README
   - Add code comments
   - Update type definitions

4. **Follow Patterns**
   - Use existing component structure
   - Follow naming conventions
   - Maintain type safety

---

## License

[Your License Here]

## Contact

[Your Contact Information]

---

**Last Updated:** December 26, 2024
**Template Version:** 1.0.0
**Branch:** development (clean template)
