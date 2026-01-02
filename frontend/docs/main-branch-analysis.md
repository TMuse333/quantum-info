# Main Branch Codebase Analysis

**Date**: December 25, 2024  
**Branch**: `main`  
**Status**: ✅ Working in Vercel deployment  
**Purpose**: Document current working state to compare with experiment branch

---

## Overview

This document captures the exact state of the `main` branch codebase that successfully deploys to Vercel. This will be used to identify differences with the `experiment` branch's GitHub API deployment code.

---

## File Structure

### Root Configuration Files

```
frontend/
├── .nvmrc                          # Node version: 20.18.0
├── eslint.config.mjs               # ESLint configuration
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies (Next.js 16.1.1)
├── package-lock.json               # Locked dependencies
├── postcss.config.mjs              # PostCSS configuration
├── tsconfig.json                    # TypeScript configuration
├── vercel.json                      # Vercel deployment config
└── production-snapshots/            # Version snapshots (v39-v51)
```

### Source Code Structure

```
frontend/src/
├── app/                            # Next.js App Router
│   ├── about/
│   │   └── page.tsx                # About page route
│   ├── services/
│   │   └── page.tsx                # Services page route
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page route (index)
│   ├── globals.css                 # Global styles
│   └── favicon.ico
│
├── components/
│   ├── design/                     # OLD component structure (legacy)
│   │   ├── contentPieces/
│   │   ├── forms/
│   │   ├── herobanners/
│   │   ├── navbars/
│   │   ├── testimonials/
│   │   └── textComponents/
│   │
│   ├── designs/                    # ACTIVE component structure
│   │   ├── contentPieces/
│   │   │   ├── experienceCard/
│   │   │   │   ├── experienceCard.tsx
│   │   │   │   └── index.ts
│   │   │   ├── imageTextBox/
│   │   │   │   ├── imageTextBox.tsx
│   │   │   │   └── index.ts
│   │   │   ├── marketingShowcase/
│   │   │   │   ├── marketingShowcase.tsx
│   │   │   │   └── index.ts
│   │   │   └── profileCredentials/
│   │   │       ├── profileCredentials.tsx
│   │   │       └── index.ts
│   │   ├── herobanners/
│   │   │   └── auroraImageHero/
│   │   │       ├── auroraImageHero.tsx
│   │   │       └── index.ts
│   │   ├── testimonials/
│   │   │   └── testimonials3/
│   │   │       ├── testimonials3.tsx
│   │   │       └── index.ts
│   │   └── textComponents/
│   │       ├── processSteps/
│   │       ├── textAndList/
│   │       └── valueProposition/
│   │
│   └── pageComponents/             # Page-level components
│       ├── about.tsx
│       ├── home.tsx
│       ├── index.tsx
│       └── services.tsx
│
├── data/                           # Component props data
│   ├── about.data.ts
│   ├── home.data.ts
│   ├── index.data.ts
│   └── services.data.ts
│
├── lib/
│   ├── colorUtils/                 # Color utility functions
│   │   ├── colorMath.ts
│   │   ├── colorPalette.ts
│   │   ├── gradientUtils.ts
│   │   └── index.ts
│   └── hooks/
│       └── isMobile.ts             # Mobile detection hook
│
└── types/                          # TypeScript type definitions
    ├── colors.ts
    ├── componentTypes.ts
    ├── forms.ts
    ├── index.ts
    └── navbar.ts
```

---

## Key Configuration Details

### package.json

```json
{
  "engines": {
    "node": ">=20.9.0 <21.0.0",
    "npm": ">=9.0.0"
  },
  "dependencies": {
    "next": "16.1.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.546.0",
    "phosphor-react": "^1.4.1",
    "axios": "^1.12.2"
  },
  "devDependencies": {
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  }
}
```

**Key Points:**
- Next.js: `16.1.1` (latest stable)
- Node.js requirement: `>=20.9.0`
- React: `19.1.0`
- No deployment-related dependencies (no `@octokit/rest`, `@vercel/client`, etc.)

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};
```

**Key Points:**
- Vercel Blob Storage configured for images
- TypeScript errors will fail builds
- No `eslint` config (not supported in Next.js 15/16 config)

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./",
  "outputDirectory": ".next"
}
```

**Key Points:**
- No `nodeVersion` property (invalid in Vercel config)
- Node version controlled via `package.json` engines or `.nvmrc`
- Standard Next.js build configuration

### .nvmrc

```
20.18.0
```

**Key Points:**
- Specifies Node.js 20.18.0
- Vercel will use this if present

---

## Component Structure

### Production Components (designs/)

All production components follow this pattern:
- Component file: `{componentName}.tsx`
- Index file: `index.ts` (exports component and types)
- No `.prod.tsx` files (components are already production-ready)

**Example: `experienceCard/`**
```
experienceCard.tsx          # Production component
index.ts                    # Exports: ExperienceCard, ExperienceCardProps
```

### Page Components

Page components import directly from `designs/`:
```typescript
// home.tsx
import ExperienceCard, { ExperienceCardProps } from '@/components/designs/contentPieces/experienceCard/experienceCard';
```

**Key Points:**
- Direct imports (no `.prod` suffix)
- Props types imported alongside components
- Components spread props from data files

### Data Files

Data files (`*.data.ts`) contain:
- Type imports from component files
- Exported props objects for each component
- Props match component interfaces exactly

**Example: `home.data.ts`**
```typescript
import { ExperienceCardProps } from "@/components/designs/contentPieces/experienceCard";

export const component3Props: ExperienceCardProps = {
  // ... props
};
```

---

## Critical Differences from Experiment Branch

### ❌ NOT PRESENT in Main Branch

1. **No deployment code:**
   - ❌ `src/lib/deploy/` - Does not exist
   - ❌ `src/lib/vercel/` - Does not exist
   - ❌ `src/lib/config.ts` - Does not exist
   - ❌ `src/app/api/production/` - Does not exist
   - ❌ `src/app/api/vercel/` - Does not exist

2. **No editor code:**
   - ❌ `src/components/editor/` - Does not exist
   - ❌ `src/stores/` (deployment stores) - Does not exist

3. **No `.prod.tsx` files:**
   - All components are production-ready as `.tsx`
   - No dual file structure (`.tsx` + `.prod.tsx`)

4. **No file generation:**
   - Data files are static (not generated)
   - Page components are static (not generated)
   - No `generatePageFiles.ts` or similar

### ✅ PRESENT in Main Branch

1. **Static file structure:**
   - All files are committed directly to git
   - No runtime generation during deployment

2. **Direct component imports:**
   - Components imported from `designs/` folder
   - No path manipulation or renaming

3. **Simple data structure:**
   - Data files are TypeScript files with exported props
   - No JSON parsing or transformation

---

## Build Process

### Local Build
```bash
npm install
npm run build
```

### Vercel Build
1. Vercel detects `nextjs` framework
2. Reads `package.json` engines → Node 20.x
3. Runs `npm install`
4. Runs `npm run build`
5. Deploys `.next` output

**No custom deployment scripts or API calls needed.**

---

## Type System

### Type Exports (`src/types/index.ts`)

```typescript
export * from './colors';
export * from './componentTypes';
export * from './forms';
export * from './navbar';
```

**Key Points:**
- Only exports essential types
- No `templateTypes`, `llmOutputs`, `websiteDataTypes`, `user`, `website`
- No `registry` folder types

### Component Types

All component props extend `BaseComponentProps`:
- `title: string`
- `description: string`
- `mainColor: string`
- `textColor: string`
- `baseBgColor: string`
- `bgLayout: GradientConfig`
- `subTitle: string` (required)
- `buttonText: string`
- `images?: Record<string, ImageProp>`

---

## Recent Changes (Last Commit)

**Commit**: `b7415a1` - "vecel json shenenigans"

**Changes:**
- Modified: `frontend/vercel.json` (removed `nodeVersion` property)

**Previous Commits:**
- `50de21a` - "next 16" (upgraded to Next.js 16.1.1)
- `4063922` - "Save production snapshot v51"
- `8779f9f` - "Generated 9 files for 3 pages"

---

## Deployment Flow (Current - Main Branch)

1. **Developer commits** changes to `main` branch
2. **Vercel detects** push via GitHub integration
3. **Vercel builds** using standard Next.js build
4. **Vercel deploys** to production domain

**No custom deployment API or GitHub API calls involved.**

---

## Comparison Checklist for Experiment Branch

When comparing with experiment branch, check:

- [ ] Are deployment files (`lib/deploy/`) present in experiment but not main?
- [ ] Are `.prod.tsx` files used in experiment but not main?
- [ ] Are data files generated in experiment but static in main?
- [ ] Are page components generated in experiment but static in main?
- [ ] Are GitHub API calls used in experiment but not main?
- [ ] Are component paths manipulated in experiment but direct in main?
- [ ] Are there additional type exports in experiment?
- [ ] Are there additional dependencies in experiment?

---

## Notes for Experiment Branch Migration

1. **File Generation:**
   - Experiment branch generates files during deployment
   - Main branch has static files
   - Need to ensure generated files match main branch structure

2. **Component Paths:**
   - Experiment: `.prod.tsx` → renamed to `.tsx`
   - Main: Already `.tsx`, no renaming needed
   - Need to ensure imports match

3. **Data Files:**
   - Experiment: Generated from `websiteData.json`
   - Main: Static TypeScript files
   - Need to ensure generated format matches static format

4. **Dependencies:**
   - Experiment: Likely has deployment dependencies
   - Main: Minimal dependencies, no deployment tools
   - Need to ensure deployment code is excluded from production build

---

## Questions to Answer

1. How does experiment branch generate files that match main branch structure?
2. How are component imports handled differently?
3. How are data files generated to match the static format?
4. How are deployment files excluded from production builds?
5. How does the GitHub API deployment match Vercel's auto-deployment?

---

**Last Updated**: December 25, 2024  
**Next Steps**: Compare with experiment branch deployment code to identify mismatches

