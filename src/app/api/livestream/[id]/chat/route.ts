import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { liveChatMessages, livestreams, profiles } from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/livestream/[id]/chat — Poll for chat messages
 * Query params: ?after=<timestamp> to get messages after a specific time
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const afterParam = req.nextUrl.searchParams.get("after");

  // Verify livestream exists
  const stream = await db.query.livestreams.findFirst({
    where: eq(livestreams.id, id),
    columns: { id: true, status: true },
  });

  if (!stream) {
    return NextResponse.json({ error: "Livestream not found" }, { status: 404 });
  }

  // Build query — get messages after timestamp or last 50
  const whereConditions = [eq(liveChatMessages.livestreamId, id)];
  if (afterParam) {
    whereConditions.push(gt(liveChatMessages.createdAt, new Date(afterParam)));
  }

  const messages = await db.query.liveChatMessages.findMany({
    where: and(...whereConditions),
    orderBy: afterParam
      ? [liveChatMessages.createdAt]
      : [desc(liveChatMessages.createdAt)],
    limit: afterParam ? 100 : 50,
  });

  // Reverse if we fetched latest (no afterParam) to show oldest first
  const sorted = afterParam ? messages : messages.reverse();

  return NextResponse.json({
    messages: sorted.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      message: m.message,
      isSystem: m.isSystem,
      isCreator: m.isCreator,
      createdAt: m.createdAt.toISOString(),
    })),
    streamStatus: stream.status,
  });
}

/**
 * POST /api/livestream/[id]/chat — Send a chat message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to chat" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Verify livestream is active
  const stream = await db.query.livestreams.findFirst({
    where: eq(livestreams.id, id),
    columns: { id: true, status: true, creatorId: true },
  });

  if (!stream) {
    return NextResponse.json({ error: "Livestream not found" }, { status: 404 });
  }

  if (stream.status !== "live") {
    return NextResponse.json({ error: "Chat is only available during live streams" }, { status: 400 });
  }

  const body = await req.json();
  const { message } = body;

  if (!message?.trim() || message.trim().length > 500) {
    return NextResponse.json({ error: "Message must be 1-500 characters" }, { status: 400 });
  }

  const isCreator = stream.creatorId === profile.id;

  const [chatMsg] = await db.insert(liveChatMessages).values({
    livestreamId: id,
    userId: profile.id,
    displayName: profile.displayName || profile.handle,
    avatarUrl: profile.avatarUrl,
    message: message.trim(),
    isCreator,
  }).returning();

  return NextResponse.json({
    message: {
      id: chatMsg.id,
      displayName: chatMsg.displayName,
      avatarUrl: chatMsg.avatarUrl,
      message: chatMsg.message,
      isSystem: chatMsg.isSystem,
      isCreator: chatMsg.isCreator,
      createdAt: chatMsg.createdAt.toISOString(),
    },
  }, { status: 201 });
}
