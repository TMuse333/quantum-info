# Source of Truth for Website Data

## Current Architecture

### Primary Source of Truth: **GitHub Repository**

The source of truth is the `websiteData.json` file stored in your GitHub repository at:

- **Monorepo structure**: `frontend/src/data/websiteData.json`
- **Standard structure**: `src/data/websiteData.json`

This file is loaded via:
- `/api/versions/get-latest` - Gets the latest version from GitHub
- `/api/versions/switch-github` - Gets a specific version from GitHub

### Fallback: Local File

`frontend/src/data/websiteData.json` in your local codebase is **ONLY** a fallback used when:
- GitHub API fails
- Network error occurs
- Repository not found

**Important**: The local file is incomplete and should NOT be edited directly. It's just a safety net.

## Data Flow

```
GitHub websiteData.json (source of truth)
    ↓
API Route (/api/versions/get-latest or /switch-github)
    ↓
useWebsiteLoader hook
    ↓
websiteMasterStore (Zustand)
    ↓
websiteStore.currentPageData
    ↓
useSyncPageDataToComponent hook
    ↓
Component props (colors, text, images, etc.)
```

## What Should Be in websiteData.json

The GitHub `websiteData.json` should contain:

```json
{
  "templateName": "Default Template",
  "formData": { ... },
  "status": "in-progress",
  "colorTheme": {
    "primary": "#...",
    "secondary": "#...",
    "text": "#...",
    "background": "#...",
    "bgLayout": { ... }
  },
  "seoMetadata": { ... },
  "pages": {
    "index": {
      "id": "index",
      "name": "Home",
      "path": "/",
      "components": [
        {
          "id": "hero-1",
          "type": "auroraImageHero",
          "order": 0,
          "props": {
            "mainColor": "#...",
            "textColor": "#...",
            "baseBgColor": "#...",
            "title": "Your Title",  // ← Text content
            "description": "Your description",  // ← Text content
            // ... other props with text, images, styles
          }
        }
        // ... more components
      ]
    }
    // ... more pages
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Current Issue: Text Not Loading

If colors are working but text is not, it means:

1. ✅ `colorTheme` is being loaded from GitHub
2. ❌ Component `props` (which contain text) are either:
   - Not saved to GitHub properly
   - Not being loaded from GitHub
   - Not being synced to components via `useSyncPageDataToComponent`

## How to Verify Source of Truth

1. Check browser console for logs:
   - `🟡 [useWebsiteLoader] ✅ Loaded from GitHub` - confirms GitHub is source
   - `🔵 [get-latest] Decoded data analysis` - shows what's in GitHub file

2. Check what's actually in GitHub:
   - Go to your GitHub repo
   - Navigate to `frontend/src/data/websiteData.json` (or `src/data/websiteData.json`)
   - Check if component `props` contain text content

3. Check if data is being saved:
   - When you edit text and click "Save Current Changes"
   - Check console for `💾 [useWebsiteSave]` logs
   - Verify the commit was created in GitHub

## Next Steps to Fix Text Issue

1. Verify GitHub file has text in component props
2. Check if `useSyncPageDataToComponent` is being called
3. Ensure component props are being merged when saving (see `useWebsiteSave.ts` line ~90)

