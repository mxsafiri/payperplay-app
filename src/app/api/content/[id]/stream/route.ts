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

    // Check if user is the creator (creators can always view their own content)
    const isCreator = contentItem.creatorId === profile.id;

    if (!isCreator) {
      // Check entitlement
      const entitlement = await db.query.entitlements.findFirst({
        where: (entitlements, { and, eq }) =>
          and(
            eq(entitlements.userId, profile.id),
            eq(entitlements.contentId, id)
          ),
      });

      if (!entitlement) {
        return NextResponse.json(
          { error: "Payment required to access this content" },
          { status: 403 }
        );
      }
    }

    // Find the video media entry with a storage key
    const videoMedia = contentItem.media?.find(
      (m) => m.mediaType === "video" && m.storageKey
    );

    if (!videoMedia?.storageKey) {
      return NextResponse.json(
        { error: "No uploaded video found for this content" },
        { status: 404 }
      );
    }

    // Generate a short-lived presigned URL for streaming
    const streamUrl = await getPresignedReadUrl({
      key: videoMedia.storageKey,
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
