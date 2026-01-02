import { NextRequest, NextResponse } from "next/server";
import { GITHUB_CONFIG } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const { REPO_OWNER, REPO_NAME, CURRENT_BRANCH, GITHUB_TOKEN } = GITHUB_CONFIG;

    console.log("🟢 [switch-github API] Request received");
    const body = await req.json();
    console.log("🟢 [switch-github API] Request body:", body);
    const { commitSha, versionNumber } = body;

    if (!commitSha && !versionNumber) {
      return NextResponse.json(
        { error: "Either commitSha or versionNumber is required" },
        { status: 400 }
      );
    }

    let targetCommitSha = commitSha;

    // If versionNumber is provided, fetch the commit list to get the SHA
    if (!targetCommitSha && versionNumber) {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
      };

      if (GITHUB_TOKEN) {
        headers.Authorization = `token ${GITHUB_TOKEN}`;
      }

      const commitsResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${CURRENT_BRANCH}&per_page=100`,
        { headers }
      );

      if (!commitsResponse.ok) {
        const errorData = await commitsResponse.json().catch(() => ({}));
        return NextResponse.json(
          { error: `Failed to fetch commits: ${errorData.message || commitsResponse.statusText}` },
          { status: commitsResponse.status }
        );
      }

      const commits = await commitsResponse.json();
      const targetCommit = commits[versionNumber - 1]; // versionNumber is 1-indexed

      if (!targetCommit) {
        return NextResponse.json(
          { error: `Version ${versionNumber} not found` },
          { status: 404 }
        );
      }

      targetCommitSha = targetCommit.sha;
    }

    // Get the commit details
    const commitHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (GITHUB_TOKEN) {
      commitHeaders.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const commitResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${targetCommitSha}`,
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

    // Get the tree SHA from the commit
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

    // Find websiteData.json in the tree (prioritize frontend path for monorepo)
    const websiteDataFile = treeData.tree.find(
      (file: any) => file.path === "frontend/src/data/websiteData.json" || file.path === "src/data/websiteData.json"
    );

    if (!websiteDataFile) {
      return NextResponse.json(
        { error: "websiteData.json not found in this commit" },
        { status: 404 }
      );
    }

    // Get the file content
    const fileHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (GITHUB_TOKEN) {
      fileHeaders.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const fileResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs/${websiteDataFile.sha}`,
      { headers: fileHeaders }
    );

    if (!fileResponse.ok) {
      const errorData = await fileResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to get file: ${errorData.message || fileResponse.statusText}` },
        { status: fileResponse.status }
      );
    }

    const fileData = await fileResponse.json();

    // Decode the content (it's base64 encoded)
    let websiteData;
    try {
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      websiteData = JSON.parse(content);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Failed to parse websiteData.json" },
        { status: 500 }
      );
    }

    // 🔍 DEBUG: Log what GitHub is returning
    console.log("🟢 [GitHub API] switch-github - Raw websiteData from GitHub:", JSON.stringify(websiteData, null, 2));
    console.log("🟢 [GitHub API] switch-github - colorTheme:", websiteData?.colorTheme);
    console.log("🟢 [GitHub API] switch-github - versionNumber:", versionNumber);
    console.log("🟢 [GitHub API] switch-github - commitSha:", targetCommitSha);

    return NextResponse.json({
      websiteData,
      commitSha: targetCommitSha,
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
    console.error("Error switching to GitHub version:", error);
    return NextResponse.json(
      { error: error.message || "Failed to switch version" },
      { status: 500 }
    );
  }
}

