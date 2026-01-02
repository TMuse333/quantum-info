import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Missing content" },
        { status: 400 }
      );
    }

    // Determine the file path based on repo type
    const repoType = process.env.NEXT_PUBLIC_REPO_TYPE;
    const relativePath = repoType === 'monorepo'
      ? 'frontend/src/data/websiteData.json'
      : 'src/data/websiteData.json';

    // Get the project root (go up from /frontend/src/app/api/files/write-local)
    const projectRoot = path.join(process.cwd(), '..');
    const filePath = path.join(projectRoot, relativePath);

    console.log("📝 [write-local] Writing to:", filePath);

    // Write the file
    await writeFile(filePath, content, 'utf-8');

    console.log("✅ [write-local] Successfully wrote local file");

    return NextResponse.json({
      success: true,
      path: relativePath,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to write local file";
    console.error("❌ [write-local] Error:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
