import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content, contentMedia } from "@/db/schema";
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

    const { title, description, category, contentType, youtubeUrl, priceTzs, videoStorageKey, thumbnailStorageKey } = await req.json();

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

    // Create content
    const [newContent] = await db
      .insert(content)
      .values({
        creatorId: profile.id,
        title,
        description,
        category,
        contentType,
        priceTzs,
        status: "published", // Auto-publish for now
        publishedAt: new Date(),
      })
      .returning();

    // Add media entries
    if (contentType === "youtube_preview" && youtubeUrl) {
      // Extract YouTube video ID for thumbnail
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
      const mediaEntries: { contentId: string; mediaType: string; storageKey: string; url?: string }[] = [
        { contentId: newContent.id, mediaType: "video", storageKey: videoStorageKey },
      ];

      if (thumbnailStorageKey) {
        mediaEntries.push({
          contentId: newContent.id,
          mediaType: "thumbnail",
          storageKey: thumbnailStorageKey,
        });
      }

      await db.insert(contentMedia).values(mediaEntries);
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
