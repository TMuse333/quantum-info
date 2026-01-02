import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { GITHUB_CONFIG } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 5MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Check current image count BEFORE uploading
    const userPrefix = `users/${USER_EMAIL}/`;
    console.log(`🔍 [upload-image] Checking images for user: ${USER_EMAIL}, prefix: ${userPrefix}`);

    const { blobs } = await list({
      prefix: userPrefix,
      limit: 1000,
      token: BLOB_TOKEN,
    });

    console.log(`📦 [upload-image] Found ${blobs.length} total blobs for user ${USER_EMAIL}`);

    // Filter for image files only
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
    const existingImages = blobs.filter((blob) => {
      const extension = blob.pathname.split(".").pop()?.toLowerCase();
      return extension && imageExtensions.includes(extension);
    });

    console.log(`🖼️ [upload-image] Found ${existingImages.length} image files for user ${USER_EMAIL}`);

    // Enforce limit
    if (existingImages.length >= MAX_IMAGES_PER_USER) {
      return NextResponse.json(
        {
          success: false,
          error: `Image limit reached. Maximum ${MAX_IMAGES_PER_USER} images per user. You currently have ${existingImages.length} images. Please delete some images before uploading new ones.`,
        },
        { status: 403 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`users/${USER_EMAIL}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      token: BLOB_TOKEN,
    });

    console.log(`✅ [upload-image] Uploaded: ${blob.url}`);

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      fileName: file.name,
      size: file.size,
      currentImageCount: existingImages.length + 1,
      maxImages: MAX_IMAGES_PER_USER,
      remainingSlots: MAX_IMAGES_PER_USER - existingImages.length - 1,
    });
  } catch (error: unknown) {
    console.error("❌ [upload-image] Upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
