import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/playlists/[id] — public playlist view for fans
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const playlist = await db.query.playlists.findFirst({
      where: and(eq(playlists.id, id), eq(playlists.isPublished, true)),
      with: {
        creator: {
          columns: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        items: {
          with: {
            content: {
              columns: {
                id: true,
                title: true,
                description: true,
                priceTzs: true,
                category: true,
                contentType: true,
                viewCount: true,
                status: true,
                createdAt: true,
              },
              with: {
                media: {
                  columns: { id: true, mediaType: true, url: true },
                },
              },
            },
          },
          orderBy: (items, { asc }) => [asc(items.position)],
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Filter out unpublished content items
    const filteredItems = playlist.items.filter(
      (item) => item.content.status === "published"
    );

    return NextResponse.json({
      ...playlist,
      items: filteredItems,
      itemCount: filteredItems.length,
    });
  } catch (error) {
    console.error("Public playlist fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
  }
}
