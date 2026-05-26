/**
 * POST /api/content/[id]/pay-guest — Initiate M-Pesa payment for a content item without an account.
 * Finds or creates a system-managed view-once link for the content, then triggers the guest payment flow.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { viewOnceLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashFingerprint } from "@/lib/fingerprint";
import { createGuestSession } from "@/lib/guest-session";
import { ensureGuestNtzsWallet, initiateGuestDeposit } from "@/lib/guest-payment";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const body = await req.json();
    const { phoneNumber, deviceFingerprint } = body;

    if (!phoneNumber || !deviceFingerprint) {
      return NextResponse.json(
        { error: "phoneNumber and deviceFingerprint are required" },
        { status: 400 }
      );
    }

    const sanitizedPhone = phoneNumber.replace(/\s/g, "");
    if (!/^(\+?255|0)\d{9}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: "Enter a valid Tanzanian phone number" },
        { status: 400 }
      );
    }

    const contentItem = await db.query.content.findFirst({
      where: (c, { eq }) => eq(c.id, contentId),
    });

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (contentItem.priceTzs === 0) {
      return NextResponse.json({ error: "This content is free" }, { status: 400 });
    }

    // Find or create a system-managed view-once link for this content.
    // The slug is derived from the content ID so it is stable and unique per content.
    const systemSlug = `sys-${contentId}`;

    let link = await db.query.viewOnceLinks.findFirst({
      where: eq(viewOnceLinks.slug, systemSlug),
    });

    if (!link) {
      try {
        const [inserted] = await db
          .insert(viewOnceLinks)
          .values({
            slug: systemSlug,
            contentId,
            creatorId: contentItem.creatorId,
            priceTzs: contentItem.priceTzs,
            teaserSeconds: 10,
            isActive: true,
          })
          .returning();
        link = inserted;
      } catch {
        // Race condition — another request inserted it; re-fetch
        link = await db.query.viewOnceLinks.findFirst({
          where: eq(viewOnceLinks.slug, systemSlug),
        });
      }
    }

    if (!link) {
      return NextResponse.json({ error: "Failed to set up payment" }, { status: 500 });
    }

    const fpHash = await hashFingerprint(deviceFingerprint);
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const { purchaseId } = await createGuestSession({
      viewOnceLinkId: link.id,
      phoneNumber: sanitizedPhone,
      deviceFingerprint: fpHash,
      amountTzs: link.priceTzs,
      ipAddress,
    });

    const guestWallet = await ensureGuestNtzsWallet(sanitizedPhone);
    if (!guestWallet) {
      return NextResponse.json(
        { error: "Payment system temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    const depositResult = await initiateGuestDeposit({
      ntzsGuestUserId: guestWallet.ntzsUserId,
      phoneNumber: sanitizedPhone,
      amountTzs: link.priceTzs,
      purchaseId,
    });

    if ("error" in depositResult) {
      return NextResponse.json(
        { error: `Payment failed: ${depositResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug: systemSlug,
      purchaseId,
      depositId: depositResult.depositId,
      instructions: depositResult.instructions,
      amountTzs: link.priceTzs,
    });
  } catch (error) {
    console.error("Guest content payment error:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
