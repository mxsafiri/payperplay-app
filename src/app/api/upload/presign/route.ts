import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  getPresignedUploadUrl,
  generateStorageKey,
  MAX_VIDEO_SIZE_BYTES,
  MAX_THUMBNAIL_SIZE_BYTES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_THUMBNAIL_TYPES,
} from "@/lib/storage/r2";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const { fileName, fileType, fileSize, mediaType } = await req.json();

    if (!fileName || !fileType || !fileSize || !mediaType) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize, mediaType" },
        { status: 400 }
      );
    }

    // Validate media type
    if (mediaType === "video") {
      if (!ALLOWED_VIDEO_TYPES.includes(fileType)) {
        return NextResponse.json(
          { error: `Unsupported video format. Allowed: MP4, WebM, MOV` },
          { status: 400 }
        );
      }
      if (fileSize > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Video too large. Maximum size: ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB` },
          { status: 400 }
        );
      }
    } else if (mediaType === "thumbnail") {
      if (!ALLOWED_THUMBNAIL_TYPES.includes(fileType)) {
        return NextResponse.json(
          { error: `Unsupported image format. Allowed: JPEG, PNG, WebP` },
          { status: 400 }
        );
      }
      if (fileSize > MAX_THUMBNAIL_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Thumbnail too large. Maximum size: ${MAX_THUMBNAIL_SIZE_BYTES / (1024 * 1024)}MB` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "mediaType must be 'video' or 'thumbnail'" },
        { status: 400 }
      );
    }

    const key = generateStorageKey({
      creatorId: profile.id,
      fileName,
      mediaType,
    });

    const { url } = await getPresignedUploadUrl({
      key,
      contentType: fileType,
    });

    return NextResponse.json({ uploadUrl: url, storageKey: key });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
