import { NextRequest, NextResponse } from "next/server";
import { GITHUB_CONFIG } from "@/lib/config";

interface FileToCommit {
  path: string;
  content: string;
  encoding: string;
}

interface CreateCommitRequest {
  commitMessage: string;
  branch?: string;
  files: FileToCommit[];
}

export async function POST(req: NextRequest) {
  try {
    const { REPO_OWNER, REPO_NAME, CURRENT_BRANCH, GITHUB_TOKEN } = GITHUB_CONFIG;

    const { commitMessage, branch = CURRENT_BRANCH, files }: CreateCommitRequest = await req.json();

    if (!commitMessage || !files || files.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: commitMessage and files are required" },
        { status: 400 }
      );
    }

    // Step 1: Get the current commit SHA for the branch
    const branchResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${branch}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!branchResponse.ok) {
      const errorData = await branchResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to get branch: ${errorData.message || branchResponse.statusText}` },
        { status: branchResponse.status }
      );
    }

    const branchData = await branchResponse.json();
    const baseTreeSha = branchData.object.sha;

    // Step 2: Get the tree SHA for the base commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${baseTreeSha}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!commitResponse.ok) {
      const errorData = await commitResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to get commit: ${errorData.message || commitResponse.statusText}` },
        { status: commitResponse.status }
      );
    }

    const commitData = await commitResponse.json();
    const baseTree = commitData.tree.sha;

    // Step 3: Create blobs for all files
    const blobPromises = files.map(async (file) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: file.content,
            encoding: file.encoding || "utf-8",
          }),
        }
      );

      if (!blobResponse.ok) {
        const errorData = await blobResponse.json().catch(() => ({}));
        throw new Error(`Failed to create blob for ${file.path}: ${errorData.message || blobResponse.statusText}`);
      }

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: "100644", // Regular file
        type: "blob",
        sha: blobData.sha,
      };
    });

    const treeItems = await Promise.all(blobPromises);

    // Step 4: Create a new tree with the blobs
    const treeResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_tree: baseTree,
          tree: treeItems,
        }),
      }
    );

    if (!treeResponse.ok) {
      const errorData = await treeResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to create tree: ${errorData.message || treeResponse.statusText}` },
        { status: treeResponse.status }
      );
    }

    const treeData = await treeResponse.json();

    // Step 5: Create a new commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [baseTreeSha],
        }),
      }
    );

    if (!newCommitResponse.ok) {
      const errorData = await newCommitResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to create commit: ${errorData.message || newCommitResponse.statusText}` },
        { status: newCommitResponse.status }
      );
    }

    const newCommitData = await newCommitResponse.json();

    // Step 6: Update the branch reference to point to the new commit
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      }
    );

    if (!updateRefResponse.ok) {
      const errorData = await updateRefResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to update branch: ${errorData.message || updateRefResponse.statusText}` },
        { status: updateRefResponse.status }
      );
    }

    // Get the total commit count for this branch to determine version number
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${branch}&per_page=1`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    let versionNumber = 1; // Default to 1 if we can't get count
    if (commitsResponse.ok) {
      const commits = await commitsResponse.json();
      // Version number is the total count of commits (1-indexed)
      versionNumber = commits.length;
    }

    return NextResponse.json({
      commitSha: newCommitData.sha,
      commitUrl: newCommitData.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${newCommitData.sha}`,
      versionNumber: versionNumber.toString(), // Return as string to match API contract, but it's a number
      message: commitMessage,
    });
  } catch (error: any) {
    console.error("Error creating GitHub commit:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create commit" },
      { status: 500 }
    );
  }
}

