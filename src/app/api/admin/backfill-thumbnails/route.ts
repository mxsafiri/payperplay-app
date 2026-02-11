import { NextResponse } from "next/server";
import { db } from "@/db";
import { content, contentMedia } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Get all YouTube content with their media
    const allContent = await db.query.content.findMany({
      where: eq(content.contentType, "youtube_preview"),
      with: {
        media: true,
      },
    });

    let backfilled = 0;

    for (const item of allContent) {
      const hasThumbnail = item.media?.some((m: { mediaType: string }) => m.mediaType === "thumbnail");
      const youtubeMedia = item.media?.find((m: { mediaType: string }) => m.mediaType === "youtube");

      if (!hasThumbnail && youtubeMedia?.url) {
        // Extract video ID from YouTube URL
        let videoId = "";
        try {
          const urlObj = new URL(youtubeMedia.url);
          videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop() || "";
        } catch {}

        if (videoId) {
          await db.insert(contentMedia).values({
            contentId: item.id,
            mediaType: "thumbnail",
            url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          });
          backfilled++;
        }
      }
    }

    return NextResponse.json({ message: `Backfilled ${backfilled} thumbnails` });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
