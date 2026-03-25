import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistItems, content, musicMetadata } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc, and, inArray } from "drizzle-orm";

// GET /api/creator/music/albums — list creator's albums, EPs, singles
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
    });
    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const albums = await db.query.playlists.findMany({
      where: and(
        eq(playlists.creatorId, profile.id),
        inArray(playlists.releaseType, ["album", "ep", "single"])
      ),
      orderBy: [desc(playlists.createdAt)],
      with: {
        items: {
          orderBy: (items, { asc }) => [asc(items.position)],
          with: {
            content: {
              columns: { id: true, title: true, priceTzs: true, status: true, contentType: true },
              with: {
                media: { columns: { id: true, mediaType: true, storageKey: true, url: true } },
                musicMetadata: { columns: { genre: true, durationSeconds: true, explicit: true, trackNumber: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ albums });
  } catch (error) {
    console.error("List albums error:", error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

// POST /api/creator/music/albums — create album, EP, or single container
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
    });
    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const { title, description, releaseType, coverImageStorageKey, releaseDate } = await req.json();

    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const validTypes = ["album", "ep", "single"];
    if (!validTypes.includes(releaseType)) {
      return NextResponse.json({ error: "releaseType must be album, ep, or single" }, { status: 400 });
    }

    const [album] = await db.insert(playlists).values({
      creatorId: profile.id,
      title: title.trim(),
      description: description?.trim() || null,
      category: "music",
      releaseType,
      coverImageUrl: coverImageStorageKey || null,
      isPublished: false,
    }).returning();

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    console.error("Create album error:", error);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}
