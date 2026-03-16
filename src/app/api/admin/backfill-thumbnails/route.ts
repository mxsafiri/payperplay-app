import { NextResponse } from "next/server";
import { db } from "@/db";
import { content, contentMedia } from "@/db/schema";
import { extractThumbnailFromR2Video } from "@/lib/server-thumbnail-extractor";

export async function POST() {
  try {
    // Get ALL content with their media
    const allContent = await db.query.content.findMany({
      with: {
        media: true,
      },
    });

    let backfilledYoutube = 0;
    let backfilledUpload = 0;
    let failedUpload = 0;
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
      
      // Handle uploaded videos - EXTRACT REAL FRAMES
      if (item.contentType === "upload") {
        const videoMedia = item.media?.find((m: any) => m.mediaType === "video");
        if (videoMedia?.storageKey) {
          try {
            console.log(`Processing: ${item.title}`);
            
            // Extract thumbnail using FFmpeg WASM
            const thumbnailKey = await extractThumbnailFromR2Video(videoMedia.storageKey);
            
            // Save to database
            await db.insert(contentMedia).values({
              contentId: item.id,
              mediaType: "thumbnail",
              storageKey: thumbnailKey,
            });
            
            backfilledUpload++;
            results.push(`✓ Upload: ${item.title} - frame extracted`);
          } catch (err) {
            failedUpload++;
            const errMsg = err instanceof Error ? err.message : String(err);
            results.push(`✗ Upload FAILED: ${item.title} - ${errMsg}`);
            console.error(`Failed to extract thumbnail for ${item.title}:`, err);
          }
        }
      }
    }

    return NextResponse.json({ 
      message: `Backfilled ${backfilledYoutube} YouTube thumbnails, ${backfilledUpload} upload thumbnails extracted. ${failedUpload} failed.`,
      results,
      success: true
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Backfill failed",
      success: false 
    }, { status: 500 });
  }
}
