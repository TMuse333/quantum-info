import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { GITHUB_CONFIG } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { USER_EMAIL, BLOB_TOKEN, MAX_IMAGES_PER_USER } = GITHUB_CONFIG;

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

    // List all blobs for this user
    const userPrefix = `users/${USER_EMAIL}/`;
    console.log(`🔍 [list-images] Listing images for user: ${USER_EMAIL}, prefix: ${userPrefix}`);

    const { blobs } = await list({
      prefix: userPrefix,
      limit: 1000,
      token: BLOB_TOKEN,
    });

    // Filter for image files only
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
    const imageBlobs = blobs.filter((blob) => {
      const extension = blob.pathname.split(".").pop()?.toLowerCase();
      return extension && imageExtensions.includes(extension);
    });

    // Transform to frontend format
    const images = imageBlobs.map((blob) => {
      const pathParts = blob.pathname.split("/");
      const fileName = pathParts.length >= 3 ? pathParts.slice(2).join("/") : blob.pathname;

      return {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        fileName,
      };
    });

    // Sort by upload date, newest first
    images.sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      return dateB - dateA;
    });

    console.log(`✅ [list-images] Found ${images.length} images for user ${USER_EMAIL}`);

    return NextResponse.json({
      success: true,
      images,
      total: images.length,
      maxImages: MAX_IMAGES_PER_USER,
      remainingSlots: Math.max(0, MAX_IMAGES_PER_USER - images.length),
      canUpload: images.length < MAX_IMAGES_PER_USER,
    });
  } catch (error: unknown) {
    console.error("❌ [list-images] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to list images";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
