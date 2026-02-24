import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { resolveAvatarUrl } from "@/lib/avatar";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = db.query.content.findMany({
      where: eq(content.status, "published"),
      orderBy: [desc(content.publishedAt)],
      limit,
      with: {
        creator: {
          columns: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        media: true,
      },
    });

    // Filter by category if provided
    let contentList;
    if (category && category !== "All") {
      contentList = await db.query.content.findMany({
        where: (content, { and, eq }) =>
          and(eq(content.status, "published"), eq(content.category, category)),
        orderBy: [desc(content.publishedAt)],
        limit,
        with: {
          creator: {
            columns: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          media: true,
        },
      });
    } else {
      contentList = await query;
    }

    // Resolve r2:// avatar URLs to fresh presigned URLs
    const resolved = await Promise.all(
      contentList.map(async (item: any) => ({
        ...item,
        creator: {
          ...item.creator,
          avatarUrl: await resolveAvatarUrl(item.creator?.avatarUrl),
        },
      }))
    );

    return NextResponse.json({ content: resolved });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
