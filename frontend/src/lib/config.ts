/**
 * GitHub Configuration
 *
 * Single source of truth for GitHub repo information.
 * Set via environment variables at deployment time.
 */

export const GITHUB_CONFIG = {
  // Repo identification (set by parent repo via Vercel environment variables)
  REPO_OWNER: process.env.REPO_OWNER || "TMuse333",                    // Defaults to TMuse333 for local dev only
  REPO_NAME: process.env.REPO_NAME || "next-js-template",              // Defaults to template name for local dev only

  // Branch strategy
  CURRENT_BRANCH: process.env.CURRENT_BRANCH || "development",         // Changed from "experiment" to match parent repo
  PRODUCTION_BRANCH: process.env.PRODUCTION_BRANCH || "main",          // Production branch

  // GitHub API token
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",                        // Required for GitHub API access

  // Optional metadata
  USER_ID: process.env.USER_ID,
  PROJECT_ID: process.env.PROJECT_ID,

  // User identification (for blob storage)
  USER_EMAIL: process.env.USER_EMAIL,                                  // User's email for blob path

  // Vercel Blob configuration
  BLOB_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || "",                 // Vercel Blob access token
  MAX_IMAGES_PER_USER: 20,                                             // Image upload limit per user
} as const;

// Validate and warn on startup
if (typeof window === 'undefined') {
  // Only validate server-side
  if (!process.env.REPO_NAME) {
    console.warn(
      "⚠️ REPO_NAME not set - using default 'next-js-template' for demo/development.\n" +
      "   For production deployments, this should be set by the parent app."
    );
  }

  if (!GITHUB_CONFIG.GITHUB_TOKEN) {
    console.warn(
      "⚠️ GITHUB_TOKEN not set - GitHub features may not work.\n" +
      "   Set this environment variable to enable version control and saving."
    );
  }

  console.log("✅ GitHub config initialized:", {
    repoOwner: GITHUB_CONFIG.REPO_OWNER,
    repoName: GITHUB_CONFIG.REPO_NAME,
    currentBranch: GITHUB_CONFIG.CURRENT_BRANCH,
    productionBranch: GITHUB_CONFIG.PRODUCTION_BRANCH,
    hasGitHubToken: !!GITHUB_CONFIG.GITHUB_TOKEN,
  });
}
