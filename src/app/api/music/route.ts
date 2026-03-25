import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content, playlists } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

// GET /api/music — public listing of songs + albums/EPs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get("genre");
    const type = searchParams.get("type") || "songs"; // songs | albums
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (type === "albums") {
      const albums = await db.query.playlists.findMany({
        where: and(
          eq(playlists.isPublished, true),
          eq(playlists.category, "music"),
          inArray(playlists.releaseType, ["album", "ep", "single"])
        ),
        orderBy: [desc(playlists.createdAt)],
        limit,
        with: {
          creator: {
            columns: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          items: {
            orderBy: (items, { asc }) => [asc(items.position)],
            with: {
              content: {
                columns: { id: true, title: true, priceTzs: true, contentType: true },
                with: {
                  musicMetadata: { columns: { genre: true, durationSeconds: true, explicit: true } },
                },
              },
            },
          },
        },
      });
      return NextResponse.json({ albums });
    }

    // Default: songs
    const where = and(
      eq(content.status, "published"),
      eq(content.category, "music")
    );

    const songs = await db.query.content.findMany({
      where,
      orderBy: [desc(content.publishedAt)],
      limit,
      with: {
        creator: {
          columns: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
        media: {
          columns: { id: true, mediaType: true, storageKey: true, url: true },
        },
        musicMetadata: true,
      },
    });

    // Filter by genre if provided
    const filtered = genre
      ? songs.filter((s) => s.musicMetadata?.genre?.toLowerCase() === genre.toLowerCase())
      : songs;

    return NextResponse.json({ songs: filtered });
  } catch (error) {
    console.error("Music listing error:", error);
    return NextResponse.json({ error: "Failed to fetch music" }, { status: 500 });
  }
}
