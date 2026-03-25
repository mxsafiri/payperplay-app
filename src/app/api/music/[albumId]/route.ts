import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/music/[albumId] — public album/EP detail with tracklist
export async function GET(req: NextRequest, { params }: { params: Promise<{ albumId: string }> }) {
  try {
    const { albumId } = await params;

    const album = await db.query.playlists.findFirst({
      where: and(
        eq(playlists.id, albumId),
        eq(playlists.isPublished, true)
      ),
      with: {
        creator: {
          columns: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
        items: {
          orderBy: (items, { asc }) => [asc(items.position)],
          with: {
            content: {
              columns: {
                id: true, title: true, description: true,
                priceTzs: true, contentType: true, viewCount: true, likeCount: true,
              },
              with: {
                media: { columns: { id: true, mediaType: true, storageKey: true, url: true } },
                musicMetadata: {
                  columns: {
                    genre: true, mood: true, bpm: true, explicit: true,
                    durationSeconds: true, trackNumber: true, artistCredits: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    return NextResponse.json({ album });
  } catch (error) {
    console.error("Album detail error:", error);
    return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}
