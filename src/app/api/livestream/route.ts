import { NextResponse } from "next/server";
import { db } from "@/db";
import { livestreams, profiles } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";

/**
 * GET /api/livestream — List all active/scheduled livestreams (public)
 */
export async function GET() {
  const streams = await db.query.livestreams.findMany({
    where: or(
      eq(livestreams.status, "live"),
      eq(livestreams.status, "idle")
    ),
    with: {
      creator: {
        columns: {
          id: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [desc(livestreams.startedAt), desc(livestreams.createdAt)],
  });

  // Don't expose RTMP keys to viewers
  const publicStreams = streams.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    status: s.status,
    priceTzs: s.priceTzs,
    thumbnailUrl: s.thumbnailUrl,
    viewerCount: s.viewerCount,
    scheduledAt: s.scheduledAt,
    startedAt: s.startedAt,
    creator: s.creator,
  }));

  return NextResponse.json({ streams: publicStreams });
}
