# Dry Run Testing Guide

Test the Vercel deployment flow WITHOUT actually deploying to Vercel.

---

## 🧪 What is Dry Run Mode?

Dry run mode simulates the entire deployment process without making any real API calls to Vercel. This allows you to:

- ✅ Test the deployment flow end-to-end
- ✅ Verify API routes are working
- ✅ Check timing and progress indicators
- ✅ Validate request/response formats
- ✅ Test error handling
- ❌ No actual Vercel projects created
- ❌ No actual deployments triggered
- ❌ No costs incurred

---

## 🚀 Quick Start

### Option 1: Use the Test Script (Recommended)

```bash
# Make sure your dev server is running first
npm run dev

# In another terminal, run the test script
./scripts/test-vercel-dry-run.sh
```

This will run 3 test scenarios:
1. Deploy editor (dry run)
2. Deploy production (dry run)
3. Deploy production with custom domain (dry run)

### Option 2: Manual API Calls

```bash
# Test editor deployment
curl -X POST http://localhost:3000/api/vercel/deploy-editor \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "githubOwner": "TMuse333",
    "githubRepo": "test-repo",
    "githubToken": "ghp_xxxxx",
    "dryRun": true
  }'

# Test production deployment
curl -X POST http://localhost:3000/api/vercel/deploy-production \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "githubOwner": "TMuse333",
    "githubRepo": "test-repo",
    "githubToken": "ghp_xxxxx",
    "validateBuild": true,
    "autoFixErrors": true,
    "dryRun": true
  }'
```

---

## 📊 Expected Output

### Console Logs (Server)

When you run a dry run test, you'll see output like this in your server console:

```
🚀 [DEPLOY-PRODUCTION] Starting production deployment for user: test-user
🧪 [DEPLOY-PRODUCTION] DRY RUN MODE - No actual deployment will occur
🧪 [DEPLOY-PRODUCTION] Simulating build validation...
🧪 [DEPLOY-PRODUCTION] Simulating project creation/update...
🧪 [DEPLOY-PRODUCTION] Simulating deployment...
🧪 [DEPLOY-PRODUCTION] Simulating domain assignment: test-client.com
🎉 [DEPLOY-PRODUCTION] DRY RUN COMPLETE!
🔗 [DEPLOY-PRODUCTION] Would deploy to: https://test-client.com
```

### API Response

```json
{
  "success": true,
  "projectId": "prj_mock_1703456789123",
  "deploymentId": "dpl_mock_1703456789456",
  "productionUrl": "https://test-user-production.vercel.app",
  "vercelUrl": "https://test-user-production.vercel.app",
  "buildValidation": {
    "passed": true,
    "errors": [],
    "autoFixed": false,
    "fixAttempts": 0
  }
}
```

---

## ⏱️ Simulated Timings

Dry run mode includes realistic delays to simulate actual deployment:

| Stage | Delay |
|-------|-------|
| Build validation | 1.5s |
| Project creation/update | 1.0s |
| Deployment (build + deploy) | 3.0s |
| Domain assignment | 0.5s |
| **Total** | **~6s** |

Real deployments typically take **2-5 minutes**, so dry run is much faster!

---

## 🎨 Testing with UI

You can also test dry run mode from your deployment modal:

```typescript
// In your deployment modal or component
async function handleDeploy() {
  const response = await fetch('/api/vercel/deploy-production', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: process.env.NEXT_PUBLIC_USER_ID,
      githubOwner: process.env.GITHUB_USERNAME,
      githubRepo: process.env.GITHUB_REPO,
      githubToken: process.env.GITHUB_TOKEN,
      validateBuild: true,
      autoFixErrors: true,
      dryRun: true, // ← Enable dry run for testing
    }),
  });

  const result = await response.json();
  console.log('Dry run result:', result);
}
```

---

## 🔄 Switching to Real Deployments

When you're ready to do a real deployment, simply set `dryRun: false` or remove it entirely:

```diff
  const response = await fetch('/api/vercel/deploy-production', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'real-user',
      githubOwner: 'TMuse333',
      githubRepo: 'client1-website',
      githubToken: process.env.GITHUB_TOKEN,
-     dryRun: true,
+     dryRun: false, // or just remove this line
    }),
  });
```

**⚠️ Warning**: Real deployments will:
- Create actual Vercel projects
- Trigger real deployments
- Incur costs if you exceed free tier limits
- Make your site publicly accessible

---

## 🧪 What Gets Tested in Dry Run

### ✅ Tested
- API route handling
- Request validation
- Parameter parsing
- Function flow and timing
- Response formatting
- Error handling structure

### ❌ Not Tested (requires real deployment)
- Vercel API authentication
- Actual project creation
- Real build process
- Domain verification
- SSL certificate provisioning
- Network connectivity to Vercel

---

## 🐛 Troubleshooting

### Test script shows "command not found: jq"
Install jq for pretty JSON output:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

Or run tests without jq:
```bash
# Remove the "| jq '.'" part from curl commands
curl -X POST http://localhost:3000/api/vercel/deploy-editor \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### Server not responding
Make sure your Next.js dev server is running:
```bash
npm run dev
```

### Tests pass but real deployment fails
This is expected! Dry run doesn't test Vercel API authentication or actual deployment. When ready to test real deployments:

1. Verify your `VERCEL_API_TOKEN` is valid
2. Start with a small test project
3. Monitor the Vercel dashboard during deployment
4. Check server logs for detailed error messages

---

## 📝 Dry Run Checklist

Before attempting a real deployment, verify these work in dry run:

- [ ] Deploy editor dry run completes successfully
- [ ] Deploy production dry run completes successfully
- [ ] Custom domain parameter is handled correctly
- [ ] Build validation simulation runs
- [ ] API responses match expected format
- [ ] Console logs show all stages
- [ ] Timing is reasonable (under 10s)
- [ ] No errors in server console
- [ ] No errors in browser console (if testing from UI)

---

## 🎯 Next Steps

Once dry run tests pass:

1. **Verify Vercel token**: Test authentication separately
2. **Create test repo**: Make a minimal Next.js repo for testing
3. **Test real editor deploy**: Deploy editor to Vercel (one-time)
4. **Test real production deploy**: Deploy production site
5. **Integrate with UI**: Add Vercel stages to deployment modal
6. **Monitor costs**: Track Vercel usage in dashboard

---

## 💡 Pro Tips

- Use dry run mode during development to iterate quickly
- Add `dryRun` parameter to your UI for testing
- Keep dry run enabled until your UI is polished
- Test error scenarios by modifying the mock data in dry run
- Use dry run to demo the feature to stakeholders without actual deployment

---

**Ready to test?** Run: `./scripts/test-vercel-dry-run.sh`
