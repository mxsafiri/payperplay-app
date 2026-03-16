import { NextResponse } from "next/server";
import { db } from "@/db";
import { content, contentMedia } from "@/db/schema";

export async function POST() {
  try {
    // Get ALL content with their media
    const allContent = await db.query.content.findMany({
      with: {
        media: true,
      },
    });

    let backfilledYoutube = 0;
    let videosWithoutThumbnails = 0;
    const results: string[] = [];

    for (const item of allContent) {
      const hasThumbnail = item.media?.some((m: any) => m.mediaType === "thumbnail");
      
      if (hasThumbnail) continue;

      // Handle YouTube content
      if (item.contentType === "youtube_preview") {
        const youtubeMedia = item.media?.find((m: any) => m.mediaType === "youtube");
        if (youtubeMedia?.url) {
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
            backfilledYoutube++;
            results.push(`✓ YouTube: ${item.title}`);
          }
        }
      }
      
      // Handle uploaded videos - these will show creator card fallback in feed
      if (item.contentType === "upload") {
        videosWithoutThumbnails++;
        results.push(`⚠ Upload (no thumbnail): ${item.title} - will show creator card in feed`);
      }
    }

    return NextResponse.json({ 
      message: `Backfilled ${backfilledYoutube} YouTube thumbnails. ${videosWithoutThumbnails} old uploads will show creator card fallback. NEW uploads are now protected by mandatory thumbnail extraction.`,
      results 
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
