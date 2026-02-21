import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistItems, content } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, max } from "drizzle-orm";

// POST /api/creator/playlists/[id]/items — add content to playlist
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: playlistId } = await params;
    const { contentId } = await req.json();

    if (!contentId) {
      return NextResponse.json({ error: "contentId is required" }, { status: 400 });
    }

    // Verify playlist belongs to creator
    const playlist = await db.query.playlists.findFirst({
      where: and(eq(playlists.id, playlistId), eq(playlists.creatorId, profile.id)),
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Verify content belongs to creator
    const contentItem = await db.query.content.findFirst({
      where: and(eq(content.id, contentId), eq(content.creatorId, profile.id)),
    });

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check if content is already in this playlist
    const existing = await db.query.playlistItems.findFirst({
      where: and(
        eq(playlistItems.playlistId, playlistId),
        eq(playlistItems.contentId, contentId)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: "Content already in playlist" }, { status: 409 });
    }

    // Get next position
    const [maxPos] = await db
      .select({ maxPosition: max(playlistItems.position) })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));

    const nextPosition = (maxPos?.maxPosition ?? -1) + 1;

    const [item] = await db
      .insert(playlistItems)
      .values({
        playlistId,
        contentId,
        position: nextPosition,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Add playlist item error:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

// DELETE /api/creator/playlists/[id]/items — remove content from playlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: playlistId } = await params;
    const { contentId } = await req.json();

    if (!contentId) {
      return NextResponse.json({ error: "contentId is required" }, { status: 400 });
    }

    // Verify playlist belongs to creator
    const playlist = await db.query.playlists.findFirst({
      where: and(eq(playlists.id, playlistId), eq(playlists.creatorId, profile.id)),
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const [deleted] = await db
      .delete(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.contentId, contentId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Item not found in playlist" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove playlist item error:", error);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
