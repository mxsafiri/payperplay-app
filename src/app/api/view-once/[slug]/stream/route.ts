/**
 * GET /api/view-once/[slug]/stream — Serve video to verified guest.
 * Validates guest session + device fingerprint, then returns presigned R2 URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { viewOnceLinks, guestPurchases } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getPresignedReadUrl } from "@/lib/storage/r2";
import { hashFingerprint, fingerprintsMatch } from "@/lib/fingerprint";

const GUEST_COOKIE_NAME = "pp_guest_session";
const STREAM_EXPIRY_SECONDS = 4 * 60 * 60; // 4 hours

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get guest session from cookie (primary) or query param (fallback)
    const cookieStore = await cookies();
    const purchaseId =
      cookieStore.get(GUEST_COOKIE_NAME)?.value ||
      req.nextUrl.searchParams.get("pid");

    if (!purchaseId) {
      console.error("[stream] No purchaseId found in cookie or query param");
      return NextResponse.json(
        { error: "No valid session — please purchase access first" },
        { status: 401 }
      );
    }

    // If the cookie was missing but we got it from query param, set it now
    // so subsequent requests work via cookie
    const cookieWasMissing = !cookieStore.get(GUEST_COOKIE_NAME)?.value;

    // Look up the link
    const link = await db.query.viewOnceLinks.findFirst({
      where: eq(viewOnceLinks.slug, slug),
      with: {
        content: { with: { media: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Validate the purchase
    const purchase = await db.query.guestPurchases.findFirst({
      where: and(
        eq(guestPurchases.id, purchaseId),
        eq(guestPurchases.viewOnceLinkId, link.id),
        eq(guestPurchases.status, "paid"),
        gt(guestPurchases.expiresAt, new Date())
      ),
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Session expired or invalid — please purchase again" },
        { status: 403 }
      );
    }

    // Validate device fingerprint
    const rawFingerprint = req.headers.get("x-device-fingerprint");
    if (rawFingerprint) {
      const fpHash = await hashFingerprint(rawFingerprint);
      if (!fingerprintsMatch(purchase.deviceFingerprint, fpHash)) {
        return NextResponse.json(
          { error: "This content was purchased on a different device" },
          { status: 403 }
        );
      }
    }

    // Find the video media
    const videoMedia = link.content.media.find(
      (m) => m.mediaType === "video" && m.storageKey
    );

    if (!videoMedia?.storageKey) {
      // Might be a YouTube preview — return the YouTube URL
      const youtubeMedia = link.content.media.find((m) => m.mediaType === "youtube");
      if (youtubeMedia?.url) {
        return NextResponse.json({
          type: "youtube",
          url: youtubeMedia.url,
          expiresIn: STREAM_EXPIRY_SECONDS,
        });
      }
      return NextResponse.json({ error: "Video not available" }, { status: 404 });
    }

    // Generate presigned URL with 4h expiry
    const streamUrl = await getPresignedReadUrl({
      key: videoMedia.storageKey,
      expiresInSeconds: STREAM_EXPIRY_SECONDS,
    });

    const response = NextResponse.json({
      type: "upload",
      url: streamUrl,
      expiresIn: STREAM_EXPIRY_SECONDS,
    });

    // If the cookie was missing (client used ?pid fallback), set it now
    if (cookieWasMissing) {
      response.cookies.set(GUEST_COOKIE_NAME, purchaseId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: STREAM_EXPIRY_SECONDS,
      });
    }

    return response;
  } catch (error) {
    console.error("Guest stream error:", error);
    return NextResponse.json({ error: "Failed to load video" }, { status: 500 });
  }
}
