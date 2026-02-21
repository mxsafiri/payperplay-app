import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistItems, content } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

// GET /api/creator/playlists — list creator's playlists
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const result = await db.query.playlists.findMany({
      where: eq(playlists.creatorId, profile.id),
      orderBy: [desc(playlists.createdAt)],
      with: {
        items: {
          with: {
            content: {
              columns: {
                id: true,
                title: true,
                priceTzs: true,
                status: true,
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

    return NextResponse.json({ playlists: result });
  } catch (error) {
    console.error("List playlists error:", error);
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}

// POST /api/creator/playlists — create a new playlist
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const { title, description, category } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [playlist] = await db
      .insert(playlists)
      .values({
        creatorId: profile.id,
        title,
        description: description || null,
        category: category || null,
      })
      .returning();

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error("Create playlist error:", error);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}
