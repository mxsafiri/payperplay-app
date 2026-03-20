/**
 * POST /api/view-once — Creator creates a view-once link for their content.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { viewOnceLinks, content, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

function generateSlug(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789"; // no confusing chars (0/O, 1/l)
  let slug = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) {
    slug += chars[b % chars.length];
  }
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Only creators can create view-once links" }, { status: 403 });
    }

    const body = await req.json();
    const { contentId, priceTzs, teaserSeconds = 10, maxPurchases, expiresAt } = body;

    if (!contentId || !priceTzs) {
      return NextResponse.json({ error: "contentId and priceTzs are required" }, { status: 400 });
    }

    if (priceTzs < 100 || priceTzs > 500000) {
      return NextResponse.json({ error: "Price must be between 100 and 500,000 TZS" }, { status: 400 });
    }

    // Verify content belongs to this creator
    const contentItem = await db.query.content.findFirst({
      where: and(eq(content.id, contentId), eq(content.creatorId, profile.id)),
    });

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found or not yours" }, { status: 404 });
    }

    if (contentItem.status !== "published") {
      return NextResponse.json({ error: "Content must be published first" }, { status: 400 });
    }

    const slug = generateSlug();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://payperplay.xyz";

    const [link] = await db
      .insert(viewOnceLinks)
      .values({
        slug,
        contentId,
        creatorId: profile.id,
        priceTzs,
        teaserSeconds: Math.min(Math.max(teaserSeconds, 5), 30), // 5–30 seconds
        maxPurchases: maxPurchases || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        slug: link.slug,
        url: `${appUrl}/v/${link.slug}`,
        priceTzs: link.priceTzs,
        teaserSeconds: link.teaserSeconds,
      },
    });
  } catch (error) {
    console.error("Create view-once link error:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}
