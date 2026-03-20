import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles, livestreams } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createLiveInput, isStreamConfigured } from "@/lib/cloudflare-stream";
import { headers } from "next/headers";

/**
 * GET /api/creator/livestream — List creator's livestreams
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile || profile.role !== "creator") {
    return NextResponse.json({ error: "Creator access required" }, { status: 403 });
  }

  const streams = await db.query.livestreams.findMany({
    where: eq(livestreams.creatorId, profile.id),
    orderBy: [desc(livestreams.createdAt)],
  });

  return NextResponse.json({ streams });
}

/**
 * POST /api/creator/livestream — Create a new livestream
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile || profile.role !== "creator") {
    return NextResponse.json({ error: "Creator access required" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, category, priceTzs, scheduledAt } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Check for existing active/idle streams
  const activeStream = await db.query.livestreams.findFirst({
    where: and(
      eq(livestreams.creatorId, profile.id),
      eq(livestreams.status, "live")
    ),
  });

  if (activeStream) {
    return NextResponse.json(
      { error: "You already have an active livestream. End it before creating a new one." },
      { status: 409 }
    );
  }

  let cfData: {
    inputId: string;
    rtmpUrl: string;
    rtmpKey: string;
    srtUrl: string;
    playbackHls: string;
    playbackWebRtc: string;
  } | null = null;

  // Try to create Cloudflare Stream live input
  if (isStreamConfigured()) {
    try {
      cfData = await createLiveInput({
        creatorId: profile.id,
        title: title.trim(),
        recording: true,
      });
    } catch (err) {
      console.error("[Livestream] Failed to create CF live input:", err);
      // Continue without CF — creator can still set up, add key later
    }
  }

  const [stream] = await db.insert(livestreams).values({
    creatorId: profile.id,
    title: title.trim(),
    description: description?.trim() || null,
    category: category || "entertainment",
    priceTzs: Math.max(0, parseInt(priceTzs) || 0),
    status: "idle",
    cfStreamInputId: cfData?.inputId || null,
    cfStreamInputUid: cfData?.inputId || null,
    rtmpUrl: cfData?.rtmpUrl || "rtmps://live.cloudflare.com:443/live/",
    rtmpKey: cfData?.rtmpKey || null,
    srtUrl: cfData?.srtUrl || null,
    cfPlaybackUrl: cfData?.playbackHls || null,
    cfWebRtcUrl: cfData?.playbackWebRtc || null,
    recordingEnabled: true,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  }).returning();

  return NextResponse.json({ stream }, { status: 201 });
}
