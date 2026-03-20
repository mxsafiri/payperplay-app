/**
 * GET /api/view-once/[slug] — Public: fetch link metadata (teaser info).
 * No auth required — this is what the shareable landing page calls.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { viewOnceLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPresignedReadUrl } from "@/lib/storage/r2";
import { resolveAvatarUrl } from "@/lib/avatar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const link = await db.query.viewOnceLinks.findFirst({
      where: eq(viewOnceLinks.slug, slug),
      with: {
        content: {
          with: { media: true },
        },
        creator: true,
      },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
    }

    // Check link-level expiry
    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    }

    // Check max purchases
    if (link.maxPurchases && link.purchaseCount >= link.maxPurchases) {
      return NextResponse.json({ error: "This link has reached its purchase limit" }, { status: 410 });
    }

    // Get thumbnail presigned URL
    const thumbnailMedia = link.content.media.find((m) => m.mediaType === "thumbnail");
    let thumbnailUrl: string | null = null;
    if (thumbnailMedia?.storageKey) {
      thumbnailUrl = await getPresignedReadUrl({ key: thumbnailMedia.storageKey, expiresInSeconds: 3600 });
    }

    // Resolve creator avatar
    let avatarUrl: string | null = null;
    if (link.creator.avatarUrl) {
      avatarUrl = await resolveAvatarUrl(link.creator.avatarUrl);
    }

    return NextResponse.json({
      slug: link.slug,
      priceTzs: link.priceTzs,
      teaserSeconds: link.teaserSeconds,
      content: {
        id: link.content.id,
        title: link.content.title,
        description: link.content.description,
        category: link.content.category,
        contentType: link.content.contentType,
      },
      creator: {
        handle: link.creator.handle,
        displayName: link.creator.displayName,
        avatarUrl,
      },
      thumbnailUrl,
      purchaseCount: link.purchaseCount,
    });
  } catch (error) {
    console.error("Get view-once link error:", error);
    return NextResponse.json({ error: "Failed to fetch link" }, { status: 500 });
  }
}
