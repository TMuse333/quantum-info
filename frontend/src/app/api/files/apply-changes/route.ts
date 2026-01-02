import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

interface FileChange {
  path: string;
  content: string;
  action: "create" | "modify" | "delete";
}

interface ApplyChangesRequest {
  files: FileChange[];
}

export async function POST(req: NextRequest) {
  try {
    const { files }: ApplyChangesRequest = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Files array is required and must not be empty" },
        { status: 400 }
      );
    }

    const results: Array<{
      path: string;
      success: boolean;
      action: string;
      error?: string;
      originalContent?: string | null; // For undo tracking
    }> = [];

    // Get project root (assuming we're in frontend directory or project root)
    const projectRoot = process.cwd();
    const frontendRoot = join(projectRoot, "frontend");
    const srcRoot = existsSync(frontendRoot) 
      ? join(frontendRoot, "src")
      : join(projectRoot, "src");

    for (const file of files) {
      try {
        // Normalize path - remove leading slash, handle both src/ and frontend/src/
        let normalizedPath = file.path.replace(/^\//, "").replace(/^frontend\//, "");
        if (!normalizedPath.startsWith("src/")) {
          normalizedPath = `src/${normalizedPath}`;
        }

        const fullPath = join(projectRoot, normalizedPath);
        const dirPath = join(fullPath, "..");

        // Track original content for undo (if file exists)
        let originalContent: string | null = null;
        if (existsSync(fullPath)) {
          try {
            originalContent = readFileSync(fullPath, "utf-8");
          } catch (err) {
            // File exists but couldn't read - that's okay
            originalContent = null;
          }
        }

        if (file.action === "delete") {
          // For delete, we'll track it but not actually delete (safer)
          // Actual deletion can happen on commit
          results.push({
            path: normalizedPath,
            success: true,
            action: "delete",
            originalContent: originalContent,
          });
        } else if (file.action === "create" || file.action === "modify") {
          // Ensure directory exists
          if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
          }

          // Write file
          writeFileSync(fullPath, file.content, "utf-8");

          results.push({
            path: normalizedPath,
            success: true,
            action: file.action,
            originalContent: originalContent, // null if file was created
          });
        } else {
          results.push({
            path: normalizedPath,
            success: false,
            action: file.action,
            error: `Unknown action: ${file.action}`,
            originalContent: originalContent,
          });
        }
      } catch (error: any) {
        results.push({
          path: file.path,
          success: false,
          action: file.action,
          error: error.message || "Unknown error",
        });
      }
    }

    // Check if all operations succeeded
    const allSucceeded = results.every((r) => r.success);
    const status = allSucceeded ? 200 : 207; // 207 = Multi-Status (some succeeded, some failed)

    return NextResponse.json({
      success: allSucceeded,
      results,
      message: allSucceeded
        ? "All files applied successfully"
        : "Some files failed to apply",
    }, { status });
  } catch (error: any) {
    console.error("Error applying file changes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to apply file changes" },
      { status: 500 }
    );
  }
}

