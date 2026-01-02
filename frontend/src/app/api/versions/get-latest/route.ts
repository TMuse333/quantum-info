import { NextRequest, NextResponse } from "next/server";
import { GITHUB_CONFIG } from "@/lib/config";

export async function GET(req: NextRequest) {
  try {
    const { REPO_OWNER, REPO_NAME, CURRENT_BRANCH, GITHUB_TOKEN } = GITHUB_CONFIG;

    // Optional: Allow branch override via query param (default to CURRENT_BRANCH)
    const searchParams = req.nextUrl.searchParams;

    // Validate branch param - should be a branch name, NOT a username
    const branchParam = searchParams.get("branch");
    const validBranches = ['experiment', 'main', 'master', 'development', 'dev'];
    const branch = (branchParam && validBranches.includes(branchParam))
      ? branchParam
      : CURRENT_BRANCH;

    console.log("🔵 [get-latest] Request:", { 
      repoOwner: REPO_OWNER, 
      repoName: REPO_NAME, 
      branch,
      hasToken: !!GITHUB_TOKEN,
      tokenLength: GITHUB_TOKEN?.length || 0
    });

    // Validate GitHub token
    if (!GITHUB_TOKEN) {
      console.error("❌ [get-latest] GITHUB_TOKEN is not set");
      return NextResponse.json(
        { 
          error: "GitHub token is not configured. Please set GITHUB_TOKEN environment variable.",
          details: "The GITHUB_TOKEN environment variable is required for GitHub API access."
        },
        { status: 401 }
      );
    }

    // Get the latest commit from the branch
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`, // Use Bearer instead of token (GitHub accepts both, but Bearer is preferred)
    };

    const commitsResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${branch}&per_page=1`,
      { headers }
    );

    if (!commitsResponse.ok) {
      const errorData = await commitsResponse.json().catch(() => ({}));
      const errorMessage = errorData.message || commitsResponse.statusText;
      
      console.error("❌ [get-latest] GitHub API error:", {
        status: commitsResponse.status,
        statusText: commitsResponse.statusText,
        error: errorMessage,
        repo: `${REPO_OWNER}/${REPO_NAME}`,
        branch,
      });

      // Provide helpful error messages
      if (commitsResponse.status === 401) {
        return NextResponse.json(
          { 
            error: "GitHub authentication failed. Please check your GITHUB_TOKEN.",
            details: errorMessage,
            help: "Make sure your GITHUB_TOKEN is valid and has the 'repo' scope. You can create a token at: https://github.com/settings/tokens"
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          error: `Failed to fetch latest commit: ${errorMessage}`,
          details: errorData
        },
        { status: commitsResponse.status }
      );
    }

    const commits = await commitsResponse.json();

    if (commits.length === 0) {
      return NextResponse.json(
        { error: "No commits found in branch" },
        { status: 404 }
      );
    }

    const latestCommit = commits[0];
    const commitSha = latestCommit.sha;
    console.log("🔵 [get-latest] Latest commit SHA:", commitSha);

    // Get the commit details
    const commitHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (GITHUB_TOKEN) {
      commitHeaders.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const commitResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${commitSha}`,
      { headers: commitHeaders }
    );

    if (!commitResponse.ok) {
      const errorData = await commitResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to get commit: ${errorData.message || commitResponse.statusText}` },
        { status: commitResponse.status }
      );
    }

    const commitData = await commitResponse.json();
    const treeSha = commitData.tree.sha;

    // Get the tree to find websiteData.json
    const treeHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (GITHUB_TOKEN) {
      treeHeaders.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const treeResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${treeSha}?recursive=1`,
      { headers: treeHeaders }
    );

    if (!treeResponse.ok) {
      const errorData = await treeResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to get tree: ${errorData.message || treeResponse.statusText}` },
        { status: treeResponse.status }
      );
    }

    const treeData = await treeResponse.json();
    
    // 🔍 DEBUG: Log all JSON files in the tree
    const jsonFiles = treeData.tree.filter((file: any) => file.path.endsWith('.json'));
    console.log("🔵 [get-latest] JSON files in tree:", jsonFiles.map((f: any) => f.path));

    // Try multiple possible paths (prioritize frontend path for monorepo)
    const possiblePaths = [
      "frontend/src/data/websiteData.json",
      "src/data/websiteData.json",
      "data/websiteData.json",
    ];

    let websiteDataFile = null;
    for (const path of possiblePaths) {
      websiteDataFile = treeData.tree.find((file: any) => file.path === path);
      if (websiteDataFile) {
        console.log("🔵 [get-latest] Found websiteData.json at:", path);
        break;
      }
    }

    if (!websiteDataFile) {
      console.error("🔵 [get-latest] websiteData.json NOT FOUND in any expected location");
      console.error("🔵 [get-latest] Searched paths:", possiblePaths);
      return NextResponse.json(
        { error: "websiteData.json not found in latest commit" },
        { status: 404 }
      );
    }

    // Get the file content
    const fileResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs/${websiteDataFile.sha}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!fileResponse.ok) {
      const errorData = await fileResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to get file: ${errorData.message || fileResponse.statusText}` },
        { status: fileResponse.status }
      );
    }

    const fileData = await fileResponse.json();

    // Decode content
    let websiteData;
    try {
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      console.log("🔵 [get-latest] Decoded content length:", content.length);
      console.log("🔵 [get-latest] First 500 chars:", content.substring(0, 500));
      
      websiteData = JSON.parse(content);
      
      // 🔍 CRITICAL DEBUG
      console.log("🔵 [get-latest] ========== DECODED DATA ANALYSIS ==========");
      console.log("🔵 [get-latest] Top-level keys:", Object.keys(websiteData));
      console.log("🔵 [get-latest] Has colorTheme:", !!websiteData.colorTheme);
      console.log("🔵 [get-latest] colorTheme value:", JSON.stringify(websiteData.colorTheme, null, 2));
      console.log("🔵 [get-latest] Has pages:", !!websiteData.pages);
      console.log("🔵 [get-latest] Pages type:", Array.isArray(websiteData.pages) ? "array" : typeof websiteData.pages);
      console.log("🔵 [get-latest] Has formData:", !!websiteData.formData);
      console.log("🔵 [get-latest] Has templateName:", !!websiteData.templateName);
      console.log("🔵 [get-latest] ==============================================");
      
    } catch (parseError) {
      console.error("🔵 [get-latest] Parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse websiteData.json" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      websiteData,
      commitSha,
      commitMessage: commitData.message,
      commitDate: commitData.author.date,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error("❌ [get-latest] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get latest version" },
      { status: 500 }
    );
  }
}

