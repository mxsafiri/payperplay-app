import { NextResponse } from "next/server";
import { db } from "@/db";
import { follows, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// GET /api/follow/following — list creators the current user follows
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const userFollows = await db.query.follows.findMany({
      where: eq(follows.followerId, profile.id),
      with: {
        creator: true,
      },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });

    const following = userFollows.map((f) => ({
      id: f.creator.id,
      handle: f.creator.handle,
      displayName: f.creator.displayName,
      avatarUrl: f.creator.avatarUrl,
      followedAt: f.createdAt,
    }));

    return NextResponse.json({ following });
  } catch (error) {
    console.error("Following list error:", error);
    return NextResponse.json({ error: "Failed to fetch following list" }, { status: 500 });
  }
}
