import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles, livestreams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getLiveInputStatus, deleteLiveInput } from "@/lib/cloudflare-stream";
import { headers } from "next/headers";

/**
 * GET /api/creator/livestream/[id] — Get stream details + live status
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const stream = await db.query.livestreams.findFirst({
    where: and(
      eq(livestreams.id, id),
      eq(livestreams.creatorId, profile.id)
    ),
  });

  if (!stream) {
    return NextResponse.json({ error: "Livestream not found" }, { status: 404 });
  }

  // Check CF status if stream has a CF input
  let cfStatus = null;
  if (stream.cfStreamInputId) {
    cfStatus = await getLiveInputStatus(stream.cfStreamInputId);

    // Auto-update status if CF says we're live but DB says idle
    if (cfStatus.connected && stream.status === "idle") {
      await db.update(livestreams)
        .set({ status: "live", startedAt: new Date(), updatedAt: new Date() })
        .where(eq(livestreams.id, id));
      stream.status = "live";
    }
  }

  return NextResponse.json({ stream, cfStatus });
}

/**
 * PATCH /api/creator/livestream/[id] — Update stream (go live, end, edit)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const stream = await db.query.livestreams.findFirst({
    where: and(
      eq(livestreams.id, id),
      eq(livestreams.creatorId, profile.id)
    ),
  });

  if (!stream) {
    return NextResponse.json({ error: "Livestream not found" }, { status: 404 });
  }

  const body = await req.json();
  const { action, title, description, category, priceTzs } = body;

  // Handle actions
  if (action === "go-live") {
    if (stream.status === "live") {
      return NextResponse.json({ error: "Already live" }, { status: 400 });
    }
    await db.update(livestreams)
      .set({ status: "live", startedAt: new Date(), updatedAt: new Date() })
      .where(eq(livestreams.id, id));
    return NextResponse.json({ status: "live" });
  }

  if (action === "end") {
    if (stream.status === "ended") {
      return NextResponse.json({ error: "Already ended" }, { status: 400 });
    }
    await db.update(livestreams)
      .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
      .where(eq(livestreams.id, id));
    return NextResponse.json({ status: "ended" });
  }

  // Regular update
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (category !== undefined) updates.category = category;
  if (priceTzs !== undefined) updates.priceTzs = Math.max(0, parseInt(priceTzs) || 0);

  const [updated] = await db.update(livestreams)
    .set(updates)
    .where(eq(livestreams.id, id))
    .returning();

  return NextResponse.json({ stream: updated });
}

/**
 * DELETE /api/creator/livestream/[id] — Delete a stream
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const stream = await db.query.livestreams.findFirst({
    where: and(
      eq(livestreams.id, id),
      eq(livestreams.creatorId, profile.id)
    ),
  });

  if (!stream) {
    return NextResponse.json({ error: "Livestream not found" }, { status: 404 });
  }

  if (stream.status === "live") {
    return NextResponse.json({ error: "Cannot delete an active livestream. End it first." }, { status: 400 });
  }

  // Clean up CF live input
  if (stream.cfStreamInputId) {
    await deleteLiveInput(stream.cfStreamInputId);
  }

  await db.delete(livestreams).where(eq(livestreams.id, id));

  return NextResponse.json({ deleted: true });
}
