# Claude Code Version Control Flow - Implementation Plan

## Overview

This document outlines the implementation plan for integrating Claude Code changes with GitHub-based version control. The system distinguishes between:

- **Simple Edits (OpenAI API)**: Text and color changes that can be reflected directly in website JSON/store data
  - Uses existing `/api/assistant/update-text` and `/api/assistant/update-color` routes
  - Changes are applied immediately to component props
  - No code generation needed

- **Structural Changes (Claude Code)**: Complex changes like reordering elements, adding sections, modifying component structure
  - Requires code generation and file modifications
  - Needs preview/confirmation before applying
  - Creates Git commits when saved

The system allows users to:
1. Request changes via natural language prompts
2. System determines if it's a simple edit (OpenAI) or structural change (Claude Code)
3. Preview and confirm structural changes before applying
4. Save confirmed changes as Git commits (creating new versions)
5. Navigate between versions (Git commits) to view or revert changes

## Current State Analysis

### What Exists

✅ **OpenAI API Integration (Simple Edits)**
- `/api/assistant/update-text` - Updates text content via OpenAI (simple edits)
- `/api/assistant/update-color` - Updates colors/gradients via OpenAI (simple edits)
- `/api/assistant/component-intro` - Component introduction/help
- Located in: `frontend/src/app/api/assistant/`
- **Note:** These routes handle simple edits that can be reflected in JSON/store data

❌ **Claude Code API Integration (Structural Changes)**
- **Missing:** `/api/assistant/determine-edit` - Classifies user prompt (simple vs structural)
- **Missing:** `/api/assistant/claude-code` - Handles structural changes via Claude Code
- **Missing:** Preview/confirmation system for structural changes

✅ **Website Assistant UI**
- `websiteAssistant.tsx` - Chat interface for Claude interactions
- Currently handles text and color updates
- Located in: `frontend/src/components/editor/websiteAssistant/`

✅ **Version Control Infrastructure**
- `versionControlPanel.tsx` - UI for viewing/selecting versions
- `useWebsiteSave.ts` - Hook for saving changes (currently MongoDB-first)
- `useWebsiteLoader.ts` - Hook for loading website data
- `websiteMasterStore.ts` - Zustand store for website state
- Located in: `frontend/src/components/editor/versionControl/` and `frontend/src/hooks/`

✅ **State Management**
- `websiteMasterStore` - Stores current website state (`WebsiteMaster`)
- `websiteStore` - Stores current page components
- Component-level state for individual edits

❌ **Missing/Incomplete**

- **Edit Classification System**
  - No route to determine if prompt is simple edit (OpenAI) or structural change (Claude Code)
  - Need `/api/assistant/determine-edit` to classify user requests

- **Claude Code Integration**
  - No Claude Code API route for structural changes
  - No preview/confirmation step before applying structural changes
  - No integration between Claude Code changes and Git commits
  - Structural changes need code generation and file modifications

- **GitHub Integration**
  - No GitHub API routes for commits (needs to be in easy-money app)
  - Save hook still uses MongoDB-first approach
  - Version control panel fetches from MongoDB, not GitHub

- **Change Preview System (Structural Changes Only)**
  - No way to preview structural changes before applying
  - No "proposed changes" state for code modifications
  - No ability to reject/accept structural changes
  - Simple edits (text/color) don't need preview - applied immediately

- **Version Creation from Changes**
  - Structural changes don't automatically create versions
  - No connection between Claude Code API calls and Git commits
  - No tracking of which changes came from Claude Code vs OpenAI vs manual edits

## Desired Flow

### Flow 1: User Prompt → Edit Classification

```
1. User types prompt in Website Assistant
   └─> "Make the hero title more engaging" (simple text edit)
   └─> OR "Swap the order of the h2 and p tags" (structural change)
   └─> OR "Add a new testimonials section after the hero" (structural change)

2. System determines edit type
   └─> POST /api/assistant/determine-edit
   └─> Returns: { type: "simple" | "structural", editType?: "text" | "color", reason: string }

3a. If SIMPLE EDIT (text/color):
   └─> Route to existing OpenAI flow
   └─> POST /api/assistant/update-text or /api/assistant/update-color
   └─> Changes applied immediately to component props
   └─> No preview needed (changes are in JSON/store)
   └─> User can save later via "Save Changes" button

3b. If STRUCTURAL CHANGE:
   └─> Route to Claude Code flow (see Flow 2)
```

### Flow 2: Simple Edit (OpenAI API) - Text/Color

```
1. User prompt classified as simple edit
   └─> "Make the hero title more engaging" → type: "simple", editType: "text"

2. API is called immediately
   └─> POST /api/assistant/update-text
   └─> Returns proposed changes (LlmTextOutput)

3. Changes applied immediately
   └─> Update component props in websiteMasterStore
   └─> UI reflects changes immediately
   └─> No preview step needed

4. User can save changes
   └─> User clicks "Save Changes" button (any time)
   └─> Creates Git commit with message
   └─> Commit message: "OpenAI Edit: [user's prompt]" or user-provided message
```

### Flow 3: Structural Change (Claude Code)

```
1. User prompt classified as structural change
   └─> "Swap the order of h2 and p tags" → type: "structural"

2. Claude explains what it will do
   └─> "I'll reorder the elements in the hero component, moving the h2 before the p tag"

3. User confirms → Claude Code API is called
   └─> POST /api/assistant/claude-code
   └─> Returns proposed code changes (file diffs, component modifications)

4. Changes are applied to preview state (NOT committed yet)
   └─> Store in temporary state (e.g., `pendingClaudeCodeChanges`)
   └─> Show preview in UI (code diff view, component preview)
   └─> User can see changes before committing

5. User confirms changes → Create Git commit
   └─> User clicks "Save Changes" or "Accept Changes"
   └─> Commit modified files to GitHub (development branch)
   └─> Commit message: "Claude Code: [user's original prompt]"
   └─> Update websiteMasterStore with committed changes
   └─> Clear pending changes

6. User rejects changes → Discard preview
   └─> Discard pendingClaudeCodeChanges
   └─> Revert to previous state
   └─> No commit created
```

### Flow 4: Manual Save (Any Time)

```
1. User makes edits (manual or Claude-assisted)
   └─> Changes stored in websiteMasterStore

2. User clicks "Save Changes" button
   └─> Opens commit message modal

3. User enters commit message
   └─> "Updated hero section and footer colors"

4. System creates Git commit
   └─> POST /api/versions/create-github
   └─> Commits websiteData.json to development branch
   └─> Returns commit SHA

5. Version is created
   └─> New version appears in Version Control Panel
   └─> User can navigate to this version later
```

### Flow 5: Version Navigation

```
1. User opens Version Control Panel
   └─> Fetches Git commits from development branch
   └─> Displays as versions (commit SHA, message, date)

2. User clicks a version
   └─> Loads websiteData.json from that commit
   └─> Updates websiteMasterStore
   └─> UI reflects that version's state

3. User can:
   - View version (read-only preview)
   - Restore version (make it current)
   - Compare versions (diff view - future enhancement)
```

## Implementation Plan

### Phase 1: Add Edit Classification Route

**Priority: CRITICAL**

#### 1.1 Create Determine Edit API Route

**New File:** `frontend/src/app/api/assistant/determine-edit/route.ts`

**Purpose:**
- Classify user prompts as simple edits (text/color) or structural changes
- Uses OpenAI or Claude to analyze the prompt
- Returns classification with reasoning

**Implementation:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const { prompt, currentComponent } = await req.json();

  // Use OpenAI to classify the edit type
  const systemPrompt = `You are an AI assistant that classifies website edit requests.

Classify the user's request into one of these categories:
- "simple-text": Simple text content changes (e.g., "make title more engaging", "change button text")
- "simple-color": Simple color/style changes (e.g., "make background blue", "change text color")
- "structural": Structural changes requiring code modification (e.g., "swap element order", "add new section", "reorder components", "modify component structure")

Return JSON with:
{
  "type": "simple" | "structural",
  "editType": "text" | "color" | null,  // Only if type is "simple"
  "reason": "Brief explanation of classification"
}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User request: "${prompt}"` },
        ],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        },
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (content) {
      const classification = JSON.parse(content);
      return NextResponse.json(classification);
    }

    // Default to structural if classification fails
    return NextResponse.json({
      type: "structural",
      editType: null,
      reason: "Unable to classify, defaulting to structural change",
    });
  } catch (error) {
    console.error("Error classifying edit:", error);
    return NextResponse.json(
      { error: "Failed to classify edit" },
      { status: 500 }
    );
  }
}
```

#### 1.2 Update Website Assistant Component

**File:** `frontend/src/components/editor/websiteAssistant/websiteAssistant.tsx`

**Changes:**
1. Add edit classification step before routing to appropriate flow
2. Route simple edits to existing OpenAI routes (immediate application)
3. Route structural changes to Claude Code flow (with preview)

**New Flow:**
```typescript
type AssistantStep =
  | "intro"
  | "classifying"        // NEW: Determining edit type
  | "simpleText"         // Simple text edit (OpenAI, immediate)
  | "simpleColor"        // Simple color edit (OpenAI, immediate)
  | "structural"         // Structural change (Claude Code, preview)
  | "previewStructural"  // NEW: Preview structural changes
  | "confirmStructural"  // NEW: Confirm structural changes
  | "chooseFieldType";   // Existing step

const sendPrompt = async () => {
  if (!prompt.trim() || isLoading) return;
  const userMsg = prompt.trim();
  setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);
  setPrompt("");
  setIsLoading(true);

  try {
    // STEP 1: Classify the edit type
    setStep("classifying");
    const classifyRes = await fetch("/api/assistant/determine-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userMsg,
        currentComponent: currentComponent?.name,
      }),
    });

    const classification = await classifyRes.json();

    if (classification.type === "simple") {
      // Simple edit - use existing OpenAI routes, apply immediately
      if (classification.editType === "text") {
        await handleSimpleTextEdit(userMsg);
      } else if (classification.editType === "color") {
        await handleSimpleColorEdit(userMsg);
      }
    } else {
      // Structural change - use Claude Code, show preview
      await handleStructuralChange(userMsg);
    }
  } catch (err) {
    console.error("Error processing request:", err);
    setChatLog((prev) => [
      ...prev,
      { role: "assistant", text: "⚠️ Oops! Something went wrong. Please try again." },
    ]);
  } finally {
    setIsLoading(false);
  }
};

// Simple text edit - apply immediately
const handleSimpleTextEdit = async (prompt: string) => {
  const textEditableFields = /* ... get fields ... */;
  
  const res = await fetch("/api/assistant/update-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      editableFields: textEditableFields,
    }),
  });

  const data = await res.json();
  
  // Apply immediately (no preview for simple edits)
  setLlmCurrentTextOutput(data);
  setAssistantIsEditing(true);
  
  setChatLog((prev) => [
    ...prev,
    { role: "assistant", text: "✅ I've updated the text! The changes are applied. Click 'Save Changes' when ready to commit." },
  ]);
  setStep("simpleText");
};

// Structural change - show preview
const handleStructuralChange = async (prompt: string) => {
  setChatLog((prev) => [
    ...prev,
    { role: "assistant", text: "I'll help you make this structural change. Let me generate the code modifications..." },
  ]);

  const res = await fetch("/api/assistant/claude-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      currentComponent: currentComponent,
      websiteData: websiteMaster, // Current website state
    }),
  });

  const data = await res.json(); // { files: [...], changes: [...], preview: "..." }
  
  // Store in preview state (don't apply yet)
  setPreviewStructuralChanges(data);
  setStep("previewStructural");
  
  setChatLog((prev) => [
    ...prev,
    { role: "assistant", text: "Here's what I'll change:\n\n[Show preview of code changes]" },
  ]);
};
```

### Phase 2: Create Claude Code API Route for Structural Changes

**Priority: CRITICAL**

#### 2.1 Create Claude Code API Route

**New File:** `frontend/src/app/api/assistant/claude-code/route.ts`

**Purpose:**
- Handle structural changes via Claude Code
- Generate code modifications
- Return file diffs and preview

**Implementation:**
```typescript
import { NextRequest, NextResponse } from "next/server";
// Use Claude API (Anthropic) for code generation

export async function POST(req: NextRequest) {
  const { prompt, currentComponent, websiteData } = await req.json();

  // Use Claude Code to generate structural changes
  // This would call Claude API with code generation capabilities
  // Returns proposed file modifications, component changes, etc.

  // For now, placeholder structure:
  return NextResponse.json({
    files: [
      {
        path: "src/components/designs/...",
        changes: "...",
        diff: "...",
      },
    ],
    preview: "Description of changes",
    originalPrompt: prompt,
  });
}
```

**Note:** This route will need Claude API integration. For now, structure the response format.

#### 2.2 Add Preview State Management

**File:** `frontend/src/context/context.tsx` or new store

**Add:**
```typescript
// In context or new store
// Only for structural changes (Claude Code)
const [previewStructuralChanges, setPreviewStructuralChanges] = useState<{
  files: Array<{ path: string; changes: string; diff: string }>;
  preview: string;
  originalPrompt: string;
} | null>(null);

// Simple edits don't need preview state - they're applied immediately
```

#### 2.3 Create Preview UI Component for Structural Changes

**New File:** `frontend/src/components/editor/websiteAssistant/PreviewStructuralChanges.tsx`

**Purpose:**
- Display proposed code changes in a diff-like view
- Show file modifications
- Highlight code differences
- Provide Accept/Reject buttons
- Show component preview if possible

### Phase 3: Integrate Structural Changes with Git Commits

**Priority: CRITICAL**

#### 3.1 Update Save Hook to Handle Structural Changes

**File:** `frontend/src/hooks/useWebsiteSave.ts`

**Changes:**
1. Detect if there are pending structural changes (Claude Code)
2. Include Claude Code prompt in commit message
3. Commit modified files to GitHub (development branch) instead of MongoDB-first
4. Clear pending changes after successful commit
5. Handle both simple edits (JSON only) and structural changes (multiple files)

**New Implementation:**
```typescript
const handleConfirmSave = async (commitMessage: string) => {
  const websiteId = searchParams.get("id");
  if (!websiteId) {
    alert("Cannot save: No website ID found.");
    return;
  }

  setIsSaving(true);

  try {
    const latestWebsiteMaster = useWebsiteMasterStore.getState().websiteMaster;
    if (!latestWebsiteMaster) {
      throw new Error("No website data to save");
    }

    // Check for pending structural changes (Claude Code)
    const pendingStructuralChanges = getPendingStructuralChanges(); // From context/store
    let filesToCommit: Array<{ path: string; content: string; encoding: string }> = [];
    let finalCommitMessage = commitMessage;
    
    if (pendingStructuralChanges) {
      // Structural change - commit multiple files
      filesToCommit = pendingStructuralChanges.files.map(file => ({
        path: file.path,
        content: file.changes, // New file content
        encoding: 'utf-8',
      }));
      
      // Also commit updated websiteData.json if structure changed
      filesToCommit.push({
        path: 'src/data/websiteData.json',
        content: JSON.stringify(latestWebsiteMaster, null, 2),
        encoding: 'utf-8',
      });
      
      // Enhance commit message with Claude Code context
      finalCommitMessage = `Claude Code: ${pendingStructuralChanges.originalPrompt}\n\n${commitMessage}`;
    } else {
      // Simple edit - only commit websiteData.json
      filesToCommit = [{
        path: 'src/data/websiteData.json',
        content: JSON.stringify(latestWebsiteMaster, null, 2),
        encoding: 'utf-8',
      }];
      
      // Check if there were recent OpenAI edits
      const recentOpenAIEdit = getRecentOpenAIEdit();
      if (recentOpenAIEdit) {
        finalCommitMessage = `OpenAI Edit: ${recentOpenAIEdit.prompt}\n\n${commitMessage}`;
      }
    }

    // STEP 1: Commit to GitHub (PRIMARY - source of truth)
    const githubResponse = await fetch('/api/versions/create-github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId,
        commitMessage: finalCommitMessage,
        branch: 'development', // Always commit to development branch
        files: filesToCommit,
      }),
    });

    if (!githubResponse.ok) {
      throw new Error('Failed to commit to GitHub');
    }

    const githubData = await githubResponse.json();
    console.log(`✅ Committed to GitHub: ${githubData.commitSha}`);

    // STEP 2: Clear pending structural changes
    if (pendingStructuralChanges) {
      clearPendingStructuralChanges();
    }

    // STEP 3: Update store and reload
    setMaster(latestWebsiteMaster);
    setSaveSuccess(true);
    setShowCommitModal(false);
    window.dispatchEvent(new CustomEvent("versionCreated"));

  } catch (error) {
    console.error("Error saving website:", error);
    alert(`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`);
    setShowCommitModal(false);
  } finally {
    setIsSaving(false);
  }
};
```

#### 3.2 Add "Save Changes" Button to Website Assistant

**File:** `frontend/src/components/editor/websiteAssistant/websiteAssistant.tsx`

**Add:**
- "Save Changes" button that appears when there are pending structural changes
- Also show button after simple edits (to commit changes)
- Triggers the same save flow as manual saves
- Shows commit message modal
- Creates Git commit with appropriate context (Claude Code or OpenAI Edit)

### Phase 4: Create GitHub API Routes (Template Repo)

**Priority: CRITICAL**

**Note:** These routes will be created in **this template repo**. GitHub API keys will be stored in environment variables (`GITHUB_TOKEN`, etc.) to keep the template repo independent.

#### 4.1 Required API Routes

**New Files in Template Repo:**

1. **`/api/versions/create-github/route.ts`**
   - Creates a Git commit on the development branch
   - Updates `websiteData.json` file
   - Returns commit SHA

2. **`/api/versions/list-github/route.ts`**
   - Fetches commits from development branch
   - Returns array of versions (commits)

3. **`/api/versions/switch-github/route.ts`**
   - Loads `websiteData.json` from specific commit SHA
   - Returns website data

4. **`/api/versions/get-latest/route.ts`**
   - Gets latest commit from development branch
   - Returns latest website data

**Implementation Details:**
- Use GitHub REST API v3 or GraphQL API
- Authenticate with GitHub token from environment (`process.env.GITHUB_TOKEN`)
- Work with `development` branch (for user repos)
- Handle errors gracefully
- Return structured responses
- Repository info can come from website data or be passed in request

**Environment Variables Needed:**
```env
GITHUB_TOKEN=your-github-token
ANTHROPIC_API_KEY=your-claude-api-key
OPENAI_KEY=your-openai-key (already exists)
```

**Example Structure:**
```typescript
// /api/versions/create-github/route.ts
export async function POST(req: NextRequest) {
  const { repoOwner, repoName, commitMessage, branch, files } = await req.json();
  
  // Create commit via GitHub API
  const commit = await createGitHubCommit({
    owner: repoOwner,
    repo: repoName,
    branch: branch || 'development',
    message: commitMessage,
    files: files, // [{ path, content, encoding }]
    token: process.env.GITHUB_TOKEN,
  });
  
  return NextResponse.json({
    commitSha: commit.sha,
    commitUrl: commit.html_url,
    versionNumber: commit.sha.substring(0, 7), // Short SHA
  });
}
```

### Phase 5: Update Version Control Panel

**Priority: HIGH**

#### 5.1 Switch to GitHub-First

**File:** `frontend/src/components/editor/versionControl/versionControlPanel.tsx`

**Changes:**
1. Fetch versions from GitHub instead of MongoDB
2. Display commits as versions
3. Show commit SHA, message, date, author
4. Handle version switching via GitHub commits

**New Implementation:**
```typescript
const fetchVersions = async () => {
  if (!websiteId) return;
  
  setLoading(true);
  try {
    // Fetch from GitHub (PRIMARY)
    const response = await fetch(`/api/versions/list-github?websiteId=${websiteId}`);
    if (response.ok) {
      const data = await response.json();
      // Transform GitHub commits to WebsiteVersion format
      const versions: WebsiteVersion[] = data.commits.map((commit: any, index: number) => ({
        versionNumber: data.commits.length - index, // Reverse order (newest first)
        websiteData: null, // Will load on demand
        createdAt: new Date(commit.commit.author.date),
        createdBy: commit.commit.author.name,
        changeDescription: commit.commit.message,
        status: 'implemented' as const, // All commits are implemented
        implementedAt: new Date(commit.commit.author.date),
        commitSha: commit.sha, // Store commit SHA
      }));
      setVersions(versions);
    } else {
      throw new Error('Failed to fetch versions from GitHub');
    }
  } catch (error) {
    console.error("Error fetching versions:", error);
    alert("Failed to load version history. Please check your repository connection.");
  } finally {
    setLoading(false);
  }
};

const handleSwitchVersion = async (versionNumber: number) => {
  if (!websiteId) return;
  
  const version = versions.find(v => v.versionNumber === versionNumber);
  if (!version?.commitSha) return;
  
  setSwitchingVersion(versionNumber);
  
  try {
    // Load from GitHub commit
    const response = await fetch(`/api/versions/switch-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteId,
        commitSha: version.commitSha,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const websiteData = data.websiteData;
      
      // Update store
      setMaster(websiteData);
      
      // Navigate to editor with version param
      router.push(`/?id=${websiteId}&version=${versionNumber}`);
    } else {
      throw new Error("Failed to load version");
    }
  } catch (error) {
    console.error("Error switching version:", error);
    alert("Failed to load version");
    setSwitchingVersion(null);
  }
};
```

### Phase 6: Update Loader Hook

**Priority: HIGH**

#### 6.1 Load from GitHub Commits

**File:** `frontend/src/hooks/useWebsiteLoader.ts`

**Changes:**
1. Check for version param in URL
2. If version exists → Load from GitHub commit
3. If no version → Load latest from GitHub
4. Fallback to MongoDB only if GitHub unavailable

**New Implementation:**
```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!isHydrated) return;

  const websiteId = searchParams.get("id");
  const versionNumber = searchParams.get("version");

  if (websiteId) {
    if (versionNumber) {
      // Load from specific GitHub commit
      const fetchFromCommit = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/versions/switch-github`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              websiteId,
              versionNumber: parseInt(versionNumber),
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const website: WebsiteMaster = data.websiteData;
            setMaster(website);
            setOriginalWebsiteMaster(JSON.parse(JSON.stringify(website)));
          }
        } catch (error) {
          setError("Failed to load version");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchFromCommit();
    } else {
      // Load latest from GitHub
      const fetchLatest = async () => {
        try {
          setIsLoading(true);
          const githubResponse = await fetch(`/api/versions/get-latest?websiteId=${websiteId}`);
          if (githubResponse.ok) {
            const data = await githubResponse.json();
            setMaster(data.websiteData);
            setOriginalWebsiteMaster(JSON.parse(JSON.stringify(data.websiteData)));
          } else {
            // Fallback to MongoDB
            const mongoResponse = await fetch(`/api/userActions/get-website?id=${websiteId}`);
            if (mongoResponse.ok) {
              const mongoData = await mongoResponse.json();
              setMaster(mongoData.website);
              setOriginalWebsiteMaster(JSON.parse(JSON.stringify(mongoData.website)));
            }
          }
        } catch (error) {
          setError("Failed to load website");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchLatest();
    }
  }
}, [isHydrated, searchParams, setMaster]);
```

## Branch Strategy Context

### Current Branches

- **`experiment`** - Testing and development (all components)
  - **Current branch** - Where we're implementing this feature
  - Full editorial components and infrastructure

- **`development`** - What clients download (editorial + empty designs)
  - **Target branch** - Where version control will work for users
  - All editorial components
  - Empty `designs/` folder (clients add their own)

- **`production`** - Client production code (no editorial)
  - No editorial components
  - Only production-ready code

### Implementation Strategy

1. **Implement in `experiment` branch first**
   - Build and test all features
   - Ensure Claude Code → Git commit flow works
   - Test version navigation

2. **Merge to `development` branch**
   - Once stable, merge to development
   - This becomes the template clients download
   - Clients will use this on their own `development` branches

3. **User's Development Branch**
   - When clients download template, they get `development` branch
   - All Claude Code changes commit to their `development` branch
   - Version control shows commits from their `development` branch
   - They can merge `development` → `main` when ready for production

## Data Flow Diagram

### Simple Edit Flow (OpenAI - Text/Color)

```
┌─────────────────┐
│  User Prompt    │
│  "Make title    │
│   more engaging"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/      │
│ assistant/      │
│ determine-edit  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Classification: │
│ type: "simple"   │
│ editType: "text"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/      │
│ assistant/      │
│ update-text     │
│ (OpenAI API)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Changes Returned│
│ (LlmTextOutput) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply IMMEDIATELY│
│ to Store        │
│ (websiteMasterStore)│
│ No preview      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Clicks     │
│ "Save Changes"  │
│ (any time)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Commit websiteData.json│
│ to GitHub       │
│ (development)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Version Created │
└─────────────────┘
```

### Structural Change Flow (Claude Code)

```
┌─────────────────┐
│  User Prompt    │
│  "Swap h2 and p │
│   tag order"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/      │
│ assistant/      │
│ determine-edit  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Classification: │
│ type: "structural"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Claude Explains │
│ What It Will Do │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Confirms   │
│ → POST /api/    │
│ assistant/      │
│ claude-code     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Proposed Code   │
│ Changes Returned│
│ (file diffs)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Preview State   │
│ (pendingStructuralChanges)│
│ Show in UI      │
│ (code diff view)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Accept│ │ Reject │
└───┬───┘ └───┬────┘
    │         │
    │         └─> Discard changes
    │             No commit
    │
    ▼
┌─────────────────┐
│ Apply Code      │
│ Changes to Files│
│ (component files)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Clicks     │
│ "Save Changes"  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Commit Modal    │
│ (Commit Message)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/      │
│ versions/       │
│ create-github   │
│ (Easy-Money)    │
│ Multiple files  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub API      │
│ Create Commit   │
│ on 'development'│
│ branch          │
│ (files + JSON)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Commit SHA      │
│ Returned        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Version Created │
│ (Appears in     │
│ Version Panel)  │
└─────────────────┘
```

## Key Implementation Details

### 1. Preview State Management

**Important:** Only structural changes (Claude Code) need preview state. Simple edits (OpenAI) are applied immediately.

**Option A: Context-based (Recommended)**
- Add `previewStructuralChanges` to `context.tsx`
- Only for structural changes (Claude Code)
- Simple edits don't need preview - applied immediately
- Accessible throughout editor components
- Easy to clear/reset

**Option B: Store-based**
- Create new Zustand store: `structuralChangesStore.ts`
- More isolated, but requires additional store setup

**Recommendation:** Use Context for simplicity, migrate to store if needed later.

### 2. Commit Message Format

**Standard Format for Simple Edits:**
```
OpenAI Edit: [original user prompt]

[optional user-provided commit message]
```

**Standard Format for Structural Changes:**
```
Claude Code: [original user prompt]

[optional user-provided commit message]
```

**Examples:**
- `OpenAI Edit: Make the hero title more engaging` (simple text edit)
- `OpenAI Edit: Update colors to match brand\n\nChanged primary color to blue` (simple color edit)
- `Claude Code: Swap the order of h2 and p tags` (structural change)
- `Claude Code: Add new testimonials section\n\nAdded after hero section` (structural change)
- `Manual: Updated footer and navigation` (manual edits, no AI)

### 3. Error Handling

**GitHub API Failures:**
- Show clear error message to user
- Don't apply changes if commit fails
- Keep changes in preview state so user can retry
- Log errors for debugging

**Claude API Failures:**
- Show error in chat
- Don't create preview
- Allow user to retry with different prompt

### 4. Version Numbering

**Strategy:**
- Versions are numbered sequentially (1, 2, 3, ...)
- Based on commit order (newest = highest number)
- Commit SHA is stored for precise version identification
- Version number is derived from commit position in history

### 5. Branch Management

**For Template Repo:**
- `experiment` - Development and testing
- `development` - Template for clients
- `production` - Production template (no editorial)

**For Client Repos:**
- `development` - Where all edits happen (Claude Code commits here)
- `main` - Production code (merged from development)

**Important:** All version control operations work on `development` branch for client repos.

## Testing Checklist

### Phase 1: Edit Classification
- [ ] `/api/assistant/determine-edit` correctly classifies simple text edits
- [ ] `/api/assistant/determine-edit` correctly classifies simple color edits
- [ ] `/api/assistant/determine-edit` correctly classifies structural changes
- [ ] Classification includes clear reasoning
- [ ] Edge cases handled (ambiguous prompts)

### Phase 2: Simple Edit Flow (OpenAI)
- [ ] Simple text edits apply immediately (no preview)
- [ ] Simple color edits apply immediately (no preview)
- [ ] Changes reflected in websiteMasterStore
- [ ] UI updates immediately
- [ ] "Save Changes" button available after edits
- [ ] Commit message includes "OpenAI Edit:" prefix

### Phase 3: Structural Change Flow (Claude Code)
- [ ] Claude explains structural changes before applying
- [ ] Preview UI shows proposed code changes (diff view)
- [ ] Accept button applies code changes
- [ ] Reject button discards changes
- [ ] Changes are not committed until user saves
- [ ] Multiple files can be modified

### Phase 4: Git Integration
- [ ] "Save Changes" creates Git commit
- [ ] Simple edits commit only websiteData.json
- [ ] Structural changes commit multiple files + websiteData.json
- [ ] Commit message includes appropriate prefix (OpenAI Edit / Claude Code)
- [ ] Commit goes to development branch
- [ ] Version appears in Version Control Panel
- [ ] Commit SHA is stored correctly

### Phase 5: Version Navigation
- [ ] Version Control Panel shows Git commits
- [ ] Clicking version loads correct state
- [ ] Version switching works correctly
- [ ] URL includes version parameter
- [ ] Can navigate back to latest version

### Phase 6: Error Handling
- [ ] GitHub API failures show error
- [ ] OpenAI API failures show error (simple edits)
- [ ] Claude API failures show error (structural changes)
- [ ] Classification failures handled gracefully
- [ ] Network errors handled gracefully
- [ ] Invalid commit SHA handled

### Phase 7: Edge Cases
- [ ] Multiple simple edits before save
- [ ] Multiple structural changes before save
- [ ] Mix of simple and structural changes
- [ ] Save with no pending changes
- [ ] Version switching with unsaved changes
- [ ] Empty commit message
- [ ] Very long commit messages
- [ ] Ambiguous prompts (classification edge cases)

## Next Steps

1. **Start with Phase 1** (Edit Classification)
   - Create `/api/assistant/determine-edit` route
   - Update `websiteAssistant.tsx` to classify prompts
   - Test classification with various prompts

2. **Then Phase 2** (Claude Code API Route)
   - Create `/api/assistant/claude-code` route
   - Integrate Claude API for code generation
   - Test structural change generation

3. **Then Phase 3** (Git Integration)
   - Update `useWebsiteSave.ts` to handle both simple and structural changes
   - Add "Save Changes" to Website Assistant
   - Test commit creation for both types

4. **Then Phase 4** (GitHub API Routes - Easy-Money)
   - Create API routes in easy-money app
   - Test with real GitHub repos
   - Ensure authentication works
   - Support multiple file commits

5. **Then Phase 5** (Version Control Panel)
   - Update to fetch from GitHub
   - Test version switching
   - Ensure UI updates correctly

6. **Finally Phase 6** (Loader Hook)
   - Update to load from GitHub
   - Test version loading
   - Ensure fallback works

## Notes

- **Template Repo vs Easy-Money App:**
  - Template repo: UI, hooks, components (this repo)
  - Easy-Money app: GitHub API routes, authentication, MongoDB

- **Development Branch Focus:**
  - All version control works on `development` branch
  - Clients download template with `development` branch
  - Their edits commit to their `development` branch
  - Production deploys from `main` branch (merged from development)

- **Edit Type Distinction:**
  - **Simple edits (OpenAI)**: Text/color changes applied immediately, no preview needed
  - **Structural changes (Claude Code)**: Code modifications require preview/confirmation
  - Both follow the same save → commit flow
  - Commit messages include appropriate prefix (OpenAI Edit / Claude Code) for traceability
  - Simple edits commit only websiteData.json
  - Structural changes commit multiple files + websiteData.json

- **Future Enhancements:**
  - Diff view between versions
  - Batch multiple Claude changes into one commit
  - Undo/redo functionality
  - Change history per component
  - Collaborative editing (multiple users)

