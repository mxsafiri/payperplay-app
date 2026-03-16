import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contentMedia } from "@/db/schema";
import { extractThumbnailFromR2Video } from "@/lib/server-thumbnail-extractor";

export async function POST(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const { contentId } = params;

    // Get content with media
    const contentItem = await db.query.content.findFirst({
      where: (content, { eq }) => eq(content.id, contentId),
      with: {
        media: true,
      },
    });

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check if already has thumbnail
    const hasThumbnail = contentItem.media?.some((m) => m.mediaType === "thumbnail");
    if (hasThumbnail) {
      return NextResponse.json({ 
        message: "Thumbnail already exists",
        skipped: true 
      });
    }

    // Get video media
    const videoMedia = contentItem.media?.find((m) => m.mediaType === "video");
    if (!videoMedia?.storageKey) {
      return NextResponse.json({ 
        error: "No video found for this content" 
      }, { status: 400 });
    }

    // Extract thumbnail
    console.log(`Extracting thumbnail for: ${contentItem.title}`);
    const thumbnailKey = await extractThumbnailFromR2Video(videoMedia.storageKey);

    // Save to database
    await db.insert(contentMedia).values({
      contentId: contentItem.id,
      mediaType: "thumbnail",
      storageKey: thumbnailKey,
    });

    return NextResponse.json({
      message: `Thumbnail extracted for: ${contentItem.title}`,
      thumbnailKey,
      success: true,
    });
  } catch (error) {
    console.error("Thumbnail extraction error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Extraction failed",
        success: false,
      },
      { status: 500 }
    );
  }
}
