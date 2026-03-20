import { NextResponse } from "next/server";
import { db } from "@/db";
import { viewOnceLinks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const links = await db.query.viewOnceLinks.findMany({
      where: eq(viewOnceLinks.creatorId, profile.id),
      orderBy: [desc(viewOnceLinks.createdAt)],
      with: {
        content: {
          columns: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({
      links: links.map((link) => ({
        id: link.id,
        slug: link.slug,
        priceTzs: link.priceTzs,
        teaserDurationSec: link.teaserDurationSec,
        isActive: link.isActive,
        maxPurchases: link.maxPurchases,
        purchaseCount: link.purchaseCount,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        content: {
          id: link.content.id,
          title: link.content.title,
        },
      })),
    });
  } catch (error) {
    console.error("View-once links fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}
