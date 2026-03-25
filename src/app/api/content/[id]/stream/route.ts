import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getPresignedReadUrl } from "@/lib/storage/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isPreview = req.nextUrl.searchParams.get("preview") === "true";

    // Get content with media
    const contentItem = await db.query.content.findFirst({
      where: (content, { eq }) => eq(content.id, id),
      with: {
        media: true,
      },
    });

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Free content is accessible to everyone
    const isFree = contentItem.priceTzs === 0;
    const isCreator = contentItem.creatorId === profile.id;

    let hasFullAccess = isFree || isCreator;

    if (!hasFullAccess && !isPreview) {
      // Check entitlement for paid content (full access)
      const entitlement = await db.query.entitlements.findFirst({
        where: (entitlements, { and, eq }) =>
          and(
            eq(entitlements.userId, profile.id),
            eq(entitlements.contentId, id)
          ),
      });

      if (entitlement) {
        hasFullAccess = true;
      } else {
        return NextResponse.json(
          { error: "Payment required to access this content" },
          { status: 403 }
        );
      }
    }

    // Find the primary media — video or audio
    const isAudio = contentItem.contentType === "audio_upload";
    const primaryMedia = contentItem.media?.find(
      (m) => m.mediaType === (isAudio ? "audio" : "video") && m.storageKey
    );

    if (!primaryMedia?.storageKey) {
      return NextResponse.json(
        { error: `No uploaded ${isAudio ? "audio" : "video"} found for this content` },
        { status: 404 }
      );
    }

    // Generate a short-lived presigned URL for streaming
    const streamUrl = await getPresignedReadUrl({
      key: primaryMedia.storageKey,
      expiresInSeconds: 3600, // 1 hour
    });

    // Also get thumbnail presigned URL if it's stored in R2
    const thumbMedia = contentItem.media?.find(
      (m) => m.mediaType === "thumbnail" && m.storageKey
    );
    let thumbnailUrl: string | undefined;
    if (thumbMedia?.storageKey) {
      thumbnailUrl = await getPresignedReadUrl({
        key: thumbMedia.storageKey,
        expiresInSeconds: 3600,
      });
    }

    return NextResponse.json({
      streamUrl,
      thumbnailUrl,
      contentType: isAudio ? "audio" : "video",
      preview: isPreview && !hasFullAccess,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Stream URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate stream URL" },
      { status: 500 }
    );
  }
}
