import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { follows, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

// GET /api/follow?creatorId=xxx — check if current user follows a creator + follower count
export async function GET(req: NextRequest) {
  try {
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    if (!creatorId) {
      return NextResponse.json({ error: "creatorId required" }, { status: 400 });
    }

    // Get follower count (public, no auth needed)
    const allFollows = await db.query.follows.findMany({
      where: eq(follows.creatorId, creatorId),
    });
    const followerCount = allFollows.length;

    // Check if current user follows this creator
    let isFollowing = false;
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, session.user.id),
      });
      if (profile) {
        const existing = await db.query.follows.findFirst({
          where: and(
            eq(follows.followerId, profile.id),
            eq(follows.creatorId, creatorId)
          ),
        });
        isFollowing = !!existing;
      }
    }

    return NextResponse.json({ isFollowing, followerCount });
  } catch (error) {
    console.error("Follow check error:", error);
    return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 });
  }
}

// POST /api/follow — toggle follow/unfollow
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { creatorId } = await req.json();
    if (!creatorId) {
      return NextResponse.json({ error: "creatorId required" }, { status: 400 });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Can't follow yourself
    if (profile.id === creatorId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existing = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, profile.id),
        eq(follows.creatorId, creatorId)
      ),
    });

    if (existing) {
      // Unfollow
      await db.delete(follows).where(eq(follows.id, existing.id));
      const count = (await db.query.follows.findMany({
        where: eq(follows.creatorId, creatorId),
      })).length;
      return NextResponse.json({ isFollowing: false, followerCount: count });
    } else {
      // Follow
      await db.insert(follows).values({
        followerId: profile.id,
        creatorId,
      });
      const count = (await db.query.follows.findMany({
        where: eq(follows.creatorId, creatorId),
      })).length;
      return NextResponse.json({ isFollowing: true, followerCount: count });
    }
  } catch (error) {
    console.error("Follow toggle error:", error);
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}
