import { NextResponse } from "next/server";
import { db } from "@/db";
import { content, creatorProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json(
        { error: "Not a creator" },
        { status: 403 }
      );
    }

    // Get content stats
    const contentStats = await db
      .select({
        totalContent: sql<number>`count(*)::int`,
        publishedContent: sql<number>`count(*) filter (where ${content.status} = 'published')::int`,
        totalViews: sql<number>`coalesce(sum(${content.viewCount}), 0)::int`,
      })
      .from(content)
      .where(eq(content.creatorId, profile.id));

    // Get earnings
    const creatorProfile = await db.query.creatorProfiles.findFirst({
      where: eq(creatorProfiles.profileId, profile.id),
    });

    return NextResponse.json({
      totalContent: contentStats[0]?.totalContent || 0,
      publishedContent: contentStats[0]?.publishedContent || 0,
      totalViews: contentStats[0]?.totalViews || 0,
      totalEarnings: parseFloat(creatorProfile?.totalEarnings || "0"),
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
