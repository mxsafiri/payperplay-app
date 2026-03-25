import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content, contentMedia, musicMetadata } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json(
        { error: "Not a creator" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const contentList = await db.query.content.findMany({
      where: eq(content.creatorId, profile.id),
      orderBy: [desc(content.createdAt)],
      limit,
      with: {
        media: true,
      },
    });

    return NextResponse.json({ content: contentList });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json(
        { error: "Not a creator" },
        { status: 403 }
      );
    }

    const {
      title, description, category, contentType, youtubeUrl, priceTzs,
      videoStorageKey, thumbnailStorageKey, audioStorageKey, status,
      // music-specific
      genre, mood, bpm, explicit, releaseDate, artistCredits, lyrics, albumId, trackNumber, durationSeconds,
    } = await req.json();

    // Validate
    if (!title || !category || !contentType || priceTzs === undefined || priceTzs === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (priceTzs < 0) {
      return NextResponse.json(
        { error: "Price cannot be negative" },
        { status: 400 }
      );
    }

    if (priceTzs > 0 && priceTzs < 500) {
      return NextResponse.json(
        { error: "Paid content must be at least 500 TZS" },
        { status: 400 }
      );
    }

    if (contentType === "youtube_preview" && !youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    if (contentType === "upload" && !videoStorageKey) {
      return NextResponse.json(
        { error: "Video file is required for uploads" },
        { status: 400 }
      );
    }

    if (contentType === "upload" && !thumbnailStorageKey) {
      return NextResponse.json(
        { error: "Thumbnail is required for video uploads. Please upload a custom thumbnail or ensure auto-generation succeeds." },
        { status: 400 }
      );
    }

    if (contentType === "audio_upload" && !audioStorageKey) {
      return NextResponse.json(
        { error: "Audio file is required for music uploads" },
        { status: 400 }
      );
    }

    // Create content
    const contentStatus = status === "draft" ? "draft" : "published";
    const [newContent] = await db
      .insert(content)
      .values({
        creatorId: profile.id,
        title,
        description,
        category: contentType === "audio_upload" ? "music" : category,
        contentType,
        priceTzs,
        status: contentStatus,
        publishedAt: contentStatus === "published" ? new Date() : null,
      })
      .returning();

    // Add media entries
    if (contentType === "youtube_preview" && youtubeUrl) {
      let videoId = "";
      try {
        const urlObj = new URL(youtubeUrl);
        videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop() || "";
      } catch {}

      const mediaEntries: { contentId: string; mediaType: string; url: string }[] = [
        { contentId: newContent.id, mediaType: "youtube", url: youtubeUrl },
      ];

      if (videoId) {
        mediaEntries.push({
          contentId: newContent.id,
          mediaType: "thumbnail",
          url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        });
      }

      await db.insert(contentMedia).values(mediaEntries);
    } else if (contentType === "upload" && videoStorageKey) {
      await db.insert(contentMedia).values([
        { contentId: newContent.id, mediaType: "video", storageKey: videoStorageKey },
        { contentId: newContent.id, mediaType: "thumbnail", storageKey: thumbnailStorageKey },
      ]);
    } else if (contentType === "audio_upload" && audioStorageKey) {
      const mediaEntries: { contentId: string; mediaType: string; storageKey?: string }[] = [
        { contentId: newContent.id, mediaType: "audio", storageKey: audioStorageKey },
      ];
      if (thumbnailStorageKey) {
        mediaEntries.push({ contentId: newContent.id, mediaType: "thumbnail", storageKey: thumbnailStorageKey });
      }
      await db.insert(contentMedia).values(mediaEntries);

      // Insert music metadata
      await db.insert(musicMetadata).values({
        contentId: newContent.id,
        albumId: albumId || null,
        trackNumber: trackNumber ? parseInt(trackNumber) : null,
        genre: genre || null,
        mood: mood || null,
        bpm: bpm ? parseInt(bpm) : null,
        explicit: explicit === true || explicit === "true",
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        artistCredits: artistCredits ? JSON.stringify(artistCredits) : null,
        lyrics: lyrics || null,
        durationSeconds: durationSeconds ? parseInt(durationSeconds) : null,
      });
    }

    return NextResponse.json({ content: newContent }, { status: 201 });
  } catch (error) {
    console.error("Content creation error:", error);
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}
