import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface FileUndo {
  path: string;
  originalContent: string | null; // null means file was created, so delete it
  action: "create" | "modify" | "delete";
}

interface UndoChangesRequest {
  files: FileUndo[];
}

export async function POST(req: NextRequest) {
  try {
    const { files }: UndoChangesRequest = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Files array is required and must not be empty" },
        { status: 400 }
      );
    }

    const results: Array<{
      path: string;
      success: boolean;
      error?: string;
    }> = [];

    const projectRoot = process.cwd();
    const frontendRoot = join(projectRoot, "frontend");
    const srcRoot = existsSync(frontendRoot) 
      ? join(frontendRoot, "src")
      : join(projectRoot, "src");

    for (const file of files) {
      try {
        // Normalize path
        let normalizedPath = file.path.replace(/^\//, "").replace(/^frontend\//, "");
        if (!normalizedPath.startsWith("src/")) {
          normalizedPath = `src/${normalizedPath}`;
        }

        const fullPath = join(projectRoot, normalizedPath);
        const dirPath = join(fullPath, "..");

        if (file.originalContent === null) {
          // File was created, so delete it
          if (existsSync(fullPath)) {
            unlinkSync(fullPath);
          }
          results.push({
            path: normalizedPath,
            success: true,
          });
        } else {
          // File was modified, restore original content
          if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
          }
          writeFileSync(fullPath, file.originalContent, "utf-8");
          results.push({
            path: normalizedPath,
            success: true,
          });
        }
      } catch (error: any) {
        results.push({
          path: file.path,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    const allSucceeded = results.every((r) => r.success);
    const status = allSucceeded ? 200 : 207;

    return NextResponse.json({
      success: allSucceeded,
      results,
      message: allSucceeded
        ? "All files restored successfully"
        : "Some files failed to restore",
    }, { status });
  } catch (error: any) {
    console.error("Error undoing file changes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to undo file changes" },
      { status: 500 }
    );
  }
}

