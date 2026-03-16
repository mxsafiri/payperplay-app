import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentMedia } from "@/db/schema";

export async function GET() {
  try {
    // Get ALL content with their media
    const allContent = await db.query.content.findMany({
      with: {
        media: true,
      },
    });

    const youtubeNeedingThumbnails: any[] = [];
    const uploadsNeedingThumbnails: any[] = [];

    for (const item of allContent) {
      const hasThumbnail = item.media?.some((m: any) => m.mediaType === "thumbnail");
      
      if (hasThumbnail) continue;

      if (item.contentType === "youtube_preview") {
        youtubeNeedingThumbnails.push({
          id: item.id,
          title: item.title,
        });
      }
      
      if (item.contentType === "upload") {
        const videoMedia = item.media?.find((m: any) => m.mediaType === "video");
        if (videoMedia?.storageKey) {
          uploadsNeedingThumbnails.push({
            id: item.id,
            title: item.title,
            videoStorageKey: videoMedia.storageKey,
          });
        }
      }
    }

    return NextResponse.json({
      youtube: youtubeNeedingThumbnails,
      uploads: uploadsNeedingThumbnails,
      total: youtubeNeedingThumbnails.length + uploadsNeedingThumbnails.length,
    });
  } catch (error) {
    console.error("Backfill check error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Check failed" 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Backfill YouTube thumbnails only (fast)
    const allContent = await db.query.content.findMany({
      with: {
        media: true,
      },
    });

    let backfilledYoutube = 0;

    for (const item of allContent) {
      const hasThumbnail = item.media?.some((m: any) => m.mediaType === "thumbnail");
      
      if (hasThumbnail || item.contentType !== "youtube_preview") continue;

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
        }
      }
    }

    return NextResponse.json({
      message: `Backfilled ${backfilledYoutube} YouTube thumbnails. Use /api/admin/extract-thumbnail/[contentId] for uploads.`,
      backfilledYoutube,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Backfill failed" 
    }, { status: 500 });
  }
}
