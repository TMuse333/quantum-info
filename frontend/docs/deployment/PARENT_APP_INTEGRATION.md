# Parent App Integration Guide

**For the parent app team**: How to integrate Vercel deployment when onboarding new users.

---

## 📋 Overview

When a new user signs up in your parent app, you need to:

1. ✅ Create a GitHub repository from this template (you already do this)
2. 🆕 **Deploy the development branch (editor) to Vercel** (new requirement)
3. 🆕 **Give the user their editor URL** (new requirement)

The user will then use their editor to build their site and deploy production themselves.

---

## 🏗️ Architecture

### Two Deployments Per User

Each user gets **TWO** Vercel deployments:

| Deployment | Branch | URL | Purpose | Created By |
|------------|--------|-----|---------|------------|
| **Development Editor** | `development` | `user123-editor.vercel.app` | User edits their site | **Parent App** (during onboarding) |
| **Production Site** | `main` | `user123.com` or `user123-prod.vercel.app` | Live website | **Editor** (when user clicks "Deploy") |

**Your responsibility**: Create the Development Editor deployment
**Editor's responsibility**: Create the Production Site deployment (when user is ready)

---

## 🔧 What You Need to Add

### 1. Environment Variables

Add to your parent app's `.env`:

```env
# Vercel API (for creating editor deployments)
VERCEL_API_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=team_xxxxx  # Optional, only if using Vercel Teams

# GitHub (you probably already have this)
GITHUB_APP_TOKEN=your_github_app_token
GITHUB_ORG=your-github-org  # e.g., "TMuse333"

# Template Repo
TEMPLATE_REPO_OWNER=TMuse333
TEMPLATE_REPO_NAME=next-js-template
TEMPLATE_DEFAULT_BRANCH=development  # The branch to deploy as editor
```

### 2. Get Vercel API Token

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: "Parent App - User Onboarding"
4. Scope: Full Account (or specific team)
5. Copy the token → Add to `.env`

### 3. Install Dependencies (if needed)

If you're calling the editor's API routes:
```bash
# No additional dependencies needed - just use fetch
```

If you're deploying directly from your backend:
```bash
npm install @vercel/client
```

---

## 📝 Implementation Options

### Option A: Call Editor's API Route (Recommended)

**Pros**:
- No code duplication
- Editor handles all Vercel logic
- Easier to maintain

**Cons**:
- Requires editor to be running on a server you control
- Need to make HTTP request to editor

**Use when**: The editor template is already deployed somewhere you can call

---

### Option B: Implement Vercel Deployment in Parent App

**Pros**:
- Complete control
- No external dependencies
- Faster (no HTTP request)

**Cons**:
- Code duplication
- Need to maintain Vercel integration in two places

**Use when**: You want full control and can maintain the code

---

## 🚀 Option A: Call Editor's API Route

### Step 1: Deploy the Template to a Static Server

You need a deployed instance of the editor template that you can call:

```
https://editor-template.yourcompany.com
```

This is a **single shared instance** that provides the API endpoint. Each user will get their own Vercel deployment, but you only need one API server.

### Step 2: Update Your Onboarding Flow

```typescript
// src/services/user-onboarding.ts (or wherever you handle user signup)

async function onboardNewUser(userId: string, email: string) {
  try {
    // 1. Create GitHub repo (you already do this)
    console.log('Creating GitHub repo for user:', userId);
    const repo = await createGitHubRepo({
      userId,
      templateOwner: process.env.TEMPLATE_REPO_OWNER,
      templateRepo: process.env.TEMPLATE_REPO_NAME,
    });

    console.log('✅ GitHub repo created:', repo.name);

    // 2. Deploy development branch (editor) to Vercel (NEW!)
    console.log('Deploying editor to Vercel...');
    const editorDeployment = await deployEditorToVercel({
      userId,
      githubOwner: repo.owner,
      githubRepo: repo.name,
      githubToken: repo.accessToken,
      customDomain: `${userId}-dev.yourcompany.com`, // Optional
    });

    if (!editorDeployment.success) {
      throw new Error(`Failed to deploy editor: ${editorDeployment.error}`);
    }

    console.log('✅ Editor deployed:', editorDeployment.editorUrl);

    // 3. Save to database
    await db.users.update(userId, {
      githubRepo: repo.name,
      editorUrl: editorDeployment.editorUrl,
      vercelProjectId: editorDeployment.projectId,
      vercelDeploymentId: editorDeployment.deploymentId,
      onboardingComplete: true,
    });

    // 4. Send welcome email with editor URL
    await sendWelcomeEmail({
      email,
      editorUrl: editorDeployment.editorUrl,
      userId,
    });

    return {
      success: true,
      editorUrl: editorDeployment.editorUrl,
      githubRepo: repo.name,
    };

  } catch (error) {
    console.error('Onboarding failed:', error);
    // Rollback if needed
    await cleanupFailedOnboarding(userId);
    throw error;
  }
}

// NEW: Deploy editor to Vercel
async function deployEditorToVercel({
  userId,
  githubOwner,
  githubRepo,
  githubToken,
  customDomain,
}: {
  userId: string;
  githubOwner: string;
  githubRepo: string;
  githubToken: string;
  customDomain?: string;
}) {
  const response = await fetch('https://editor-template.yourcompany.com/api/vercel/deploy-editor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Optional: Add authentication if you secure this endpoint
      // 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
    },
    body: JSON.stringify({
      userId,
      githubOwner,
      githubRepo,
      githubToken,
      customDomain,
      dryRun: false, // Real deployment!
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Vercel deployment failed');
  }

  const result = await response.json();
  return result;
}

// Helper: Create GitHub repo (you already have this)
async function createGitHubRepo({ userId, templateOwner, templateRepo }) {
  // Your existing code to create repo from template
  // Should return: { name, owner, accessToken }
}

// Helper: Send welcome email
async function sendWelcomeEmail({ email, editorUrl, userId }) {
  await emailService.send({
    to: email,
    subject: 'Welcome! Your Website Editor is Ready',
    html: `
      <h1>Welcome to Your Website Builder!</h1>
      <p>Your personal website editor is now live at:</p>
      <a href="${editorUrl}">${editorUrl}</a>
      <p>Click the link above to start building your website.</p>
    `,
  });
}

// Helper: Cleanup on failure
async function cleanupFailedOnboarding(userId: string) {
  // Delete GitHub repo if created
  // Delete Vercel project if created
  // Delete database record
}
```

---

## 🚀 Option B: Implement Directly in Parent App

If you want to implement the Vercel deployment directly in your parent app:

### Step 1: Copy Vercel Client Code

Copy these files from the editor template to your parent app:

```
editor-template/src/lib/vercel/
  ├── vercel-client.ts     → your-app/src/lib/vercel-client.ts
  └── deploy-editor.ts     → your-app/src/lib/deploy-editor.ts
```

### Step 2: Update Your Onboarding Flow

```typescript
import { deployEditor } from '@/lib/deploy-editor';

async function onboardNewUser(userId: string, email: string) {
  // 1. Create GitHub repo (existing)
  const repo = await createGitHubRepo({ ... });

  // 2. Deploy editor to Vercel (NEW!)
  const editorDeployment = await deployEditor({
    userId,
    githubOwner: repo.owner,
    githubRepo: repo.name,
    githubToken: repo.accessToken,
    customDomain: `${userId}-dev.yourcompany.com`,
  });

  // 3. Save to database and send email
  // ... same as Option A
}
```

---

## 📧 Welcome Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .button {
      background: #0070f3;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <h1>Welcome to [Your Company]!</h1>

  <p>Hi there,</p>

  <p>Your personal website editor is now ready! 🎉</p>

  <p>You can access your editor at:</p>
  <p><strong>{{editorUrl}}</strong></p>

  <p>
    <a href="{{editorUrl}}" class="button">Open Your Editor</a>
  </p>

  <h2>What's next?</h2>
  <ol>
    <li>Click the button above to open your editor</li>
    <li>Customize your website using the visual editor</li>
    <li>Click "Deploy to Production" when you're ready to go live</li>
    <li>Share your live website URL with the world!</li>
  </ol>

  <p>Your website will be live at: <strong>{{userId}}.com</strong> (or custom domain)</p>

  <p>Questions? Reply to this email or contact support.</p>

  <p>Happy building!</p>

  <p>- The [Your Company] Team</p>
</body>
</html>
```

---

## 🗄️ Database Schema Updates

Add these fields to your `users` table:

```sql
ALTER TABLE users ADD COLUMN github_repo VARCHAR(255);
ALTER TABLE users ADD COLUMN editor_url VARCHAR(512);
ALTER TABLE users ADD COLUMN vercel_editor_project_id VARCHAR(255);
ALTER TABLE users ADD COLUMN vercel_editor_deployment_id VARCHAR(255);
ALTER TABLE users ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

Or in your ORM/schema:

```typescript
// schema.prisma (if using Prisma)
model User {
  id                        String    @id @default(cuid())
  email                     String    @unique
  githubRepo                String?
  editorUrl                 String?
  vercelEditorProjectId     String?
  vercelEditorDeploymentId  String?
  onboardingComplete        Boolean   @default(false)
  createdAt                 DateTime  @default(now())
}
```

---

## 🔒 Security Considerations

### 1. Secure the Editor API Endpoint (Important!)

The `/api/vercel/deploy-editor` endpoint should be protected:

```typescript
// In editor template: src/app/api/vercel/deploy-editor/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Add authentication
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.INTERNAL_API_KEY;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Rest of the code...
}
```

Then in your parent app:
```typescript
const response = await fetch('https://editor-template.yourcompany.com/api/vercel/deploy-editor', {
  headers: {
    'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
  },
  // ...
});
```

### 2. GitHub Token Security

**Never expose GitHub tokens to users!**

The GitHub token should:
- Be generated by your GitHub App
- Have minimal permissions (repo read/write only)
- Be stored securely in your database (encrypted)
- Be revoked when user deletes their account

### 3. Rate Limiting

Implement rate limiting on user onboarding to prevent abuse:

```typescript
// Example using rate-limiter-flexible
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 signups
  duration: 60 * 60, // per hour
});

async function onboardNewUser(userId: string, ipAddress: string) {
  try {
    await rateLimiter.consume(ipAddress);
    // Proceed with onboarding...
  } catch (error) {
    throw new Error('Too many signups. Please try again later.');
  }
}
```

---

## 💰 Cost Tracking

### Per User Costs

| Service | Cost/User/Month | Notes |
|---------|-----------------|-------|
| GitHub Repo | $0 (public) or $4 (private) | One-time setup |
| Vercel Editor | $0-20 | Free tier covers most |
| Vercel Production | $0-20 | User handles this |
| **Total** | **$0-44/user** | Most users will be $0 |

### At Scale

| Users | Monthly Cost |
|-------|--------------|
| 10 | $0-440 |
| 100 | $0-4,400 |
| 1,000 | $0-44,000 |

**Reality**: Most users will stay on free tier, so actual costs will be much lower.

### Cost Optimization

1. **Use public GitHub repos**: Saves $4/user/month
2. **Share Vercel team**: Put all user projects under one Vercel team
3. **Monitor usage**: Set up billing alerts
4. **Free tier limits**:
   - Vercel Hobby: 100GB bandwidth/month (usually enough)
   - GitHub: Unlimited public repos

---

## 🧪 Testing Your Integration

### Step 1: Test Onboarding Flow (Dry Run)

```typescript
// Test with dry run first
const result = await deployEditorToVercel({
  userId: 'test-user-123',
  githubOwner: 'TMuse333',
  githubRepo: 'test-repo',
  githubToken: 'ghp_test_token',
  dryRun: true, // No actual deployment
});

console.log(result);
// Should return mock data
```

### Step 2: Test with Real Deployment

```typescript
// Test with real Vercel deployment
const result = await deployEditorToVercel({
  userId: 'test-user-123',
  githubOwner: 'TMuse333',
  githubRepo: 'actual-test-repo',
  githubToken: process.env.GITHUB_TOKEN,
  dryRun: false, // Real deployment!
});

console.log(result.editorUrl);
// Visit the URL to verify editor is live
```

### Step 3: Clean Up Test Data

```bash
# Delete test Vercel project
# Go to vercel.com/dashboard → test-user-123-editor → Settings → Delete

# Delete test GitHub repo
gh repo delete TMuse333/test-repo
```

---

## 🐛 Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `VERCEL_API_TOKEN not set` | Missing env var | Add token to `.env` |
| `401 Unauthorized` | Invalid Vercel token | Generate new token |
| `GitHub repo not found` | Repo creation failed | Check GitHub App permissions |
| `Deployment timeout` | Vercel build taking too long | Increase timeout or check build logs |
| `Domain already exists` | Custom domain in use | Use different domain or remove from other project |

### Implement Retry Logic

```typescript
async function deployEditorWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await deployEditorToVercel(params);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(r => setTimeout(r, 2000 * attempt)); // Exponential backoff
    }
  }
}
```

---

## 📊 Monitoring and Analytics

Track these metrics in your parent app:

```typescript
// Track onboarding success rate
analytics.track('user_onboarding_started', { userId });
analytics.track('github_repo_created', { userId, repoName });
analytics.track('vercel_editor_deployed', { userId, editorUrl });
analytics.track('user_onboarding_completed', { userId, duration });

// Track failures
analytics.track('onboarding_failed', {
  userId,
  step: 'vercel_deployment',
  error: error.message
});
```

Useful queries:
- Onboarding completion rate
- Average time to deploy editor
- Most common failure points
- Vercel deployment success rate

---

## ✅ Deployment Checklist

Before going live:

**Environment Setup**:
- [ ] `VERCEL_API_TOKEN` added to production env
- [ ] `GITHUB_APP_TOKEN` working
- [ ] Template repo accessible
- [ ] Database schema updated

**Code Changes**:
- [ ] Onboarding flow updated to deploy editor
- [ ] Database saves editor URL and Vercel project ID
- [ ] Welcome email includes editor URL
- [ ] Error handling for failed deployments
- [ ] Retry logic implemented

**Testing**:
- [ ] Dry run test passes
- [ ] Real deployment test passes
- [ ] Editor URL is accessible
- [ ] User can log into editor
- [ ] GitHub sync works from editor
- [ ] Production deployment works from editor

**Security**:
- [ ] API endpoint secured (if using Option A)
- [ ] GitHub tokens encrypted
- [ ] Rate limiting enabled
- [ ] Vercel token has minimal permissions

**Monitoring**:
- [ ] Analytics tracking onboarding steps
- [ ] Error logging for failures
- [ ] Billing alerts set up in Vercel
- [ ] Success/failure notifications

---

## 🆘 Support and Questions

If you run into issues:

1. **Check the editor logs**: The editor template logs everything
2. **Check Vercel dashboard**: See actual deployment status
3. **Check GitHub repo**: Verify it was created correctly
4. **Test the API route directly**: Use curl/Postman to test
5. **Check environment variables**: Ensure all tokens are valid

**Common gotchas**:
- Vercel token must have correct scope (full account or team)
- GitHub token needs `repo` permission
- Editor template must be on `development` branch
- Build must succeed on `development` branch

---

## 📚 Additional Resources

- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [GitHub App Documentation](https://docs.github.com/en/apps)
- [Editor Template Docs](../README.md)
- [Vercel Deployment Flow](./vercel-integration-flow.md)
- [Dry Run Testing Guide](./DRY_RUN_TESTING.md)

---

**Ready to implement?** Start with Step 1: Add environment variables and test with dry run mode.
