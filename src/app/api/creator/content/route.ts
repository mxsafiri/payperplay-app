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

    const { title, description, category, contentType, youtubeUrl, priceTzs } = await req.json();

    // Validate
    if (!title || !category || !contentType || !priceTzs) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (priceTzs < 100) {
      return NextResponse.json(
        { error: "Price must be at least 100 TZS" },
        { status: 400 }
      );
    }

    if (contentType === "youtube_preview" && !youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
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

    // Add media if YouTube
    if (contentType === "youtube_preview" && youtubeUrl) {
      await db.insert(contentMedia).values({
        contentId: newContent.id,
        mediaType: "youtube",
        url: youtubeUrl,
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
