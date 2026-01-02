import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { GITHUB_CONFIG } from "@/lib/config";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const { USER_EMAIL, BLOB_TOKEN } = GITHUB_CONFIG;

    // Validate configuration
    if (!USER_EMAIL) {
      return NextResponse.json(
        { error: "No user configured for this deployment. Set USER_EMAIL environment variable." },
        { status: 400 }
      );
    }

    if (!BLOB_TOKEN) {
      return NextResponse.json(
        { error: "Blob storage not configured. Set BLOB_READ_WRITE_TOKEN environment variable." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Security: Verify the URL belongs to this user
    const userPrefix = `users/${USER_EMAIL}/`;
    if (!url.includes(userPrefix)) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own images" },
        { status: 403 }
      );
    }

    console.log(`🗑️ [delete-image] Deleting image: ${url}`);

    // Delete from Vercel Blob
    await del(url, { token: BLOB_TOKEN });

    console.log(`✅ [delete-image] Deleted successfully: ${url}`);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      deletedUrl: url,
    });
  } catch (error: unknown) {
    console.error("❌ [delete-image] Delete failed:", error);
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
