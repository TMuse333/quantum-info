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

    const perPage = parseInt(searchParams.get("per_page") || "100"); // Increased to 100 for consistency

    // Fetch commits from the branch
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    // Only add Authorization if token is available
    if (GITHUB_TOKEN) {
      headers.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${branch}&per_page=${perPage}`,
      { headers }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to fetch commits: ${errorData.message || response.statusText}` },
        { status: response.status }
      );
    }

    const commits = await response.json();

    // Transform GitHub commits to version format
    const versions = commits.map((commit: any, index: number) => ({
      versionNumber: commits.length - index, // Reverse order (newest first)
      commitSha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));

    return NextResponse.json({
      versions,
      total: commits.length,
    });
  } catch (error: any) {
    console.error("Error fetching GitHub commits:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch commits" },
      { status: 500 }
    );
  }
}

