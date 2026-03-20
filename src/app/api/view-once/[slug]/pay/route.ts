/**
 * POST /api/view-once/[slug]/pay — Guest initiates payment (M-Pesa STK push).
 * No auth required — this is the accountless flow.
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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { phoneNumber, deviceFingerprint } = body;

    if (!phoneNumber || !deviceFingerprint) {
      return NextResponse.json(
        { error: "phoneNumber and deviceFingerprint are required" },
        { status: 400 }
      );
    }

    // Validate TZ phone number format
    const sanitizedPhone = phoneNumber.replace(/\s/g, "");
    if (!/^(\+?255|0)\d{9}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: "Enter a valid Tanzanian phone number" },
        { status: 400 }
      );
    }

    // Get the link
    const link = await db.query.viewOnceLinks.findFirst({
      where: eq(viewOnceLinks.slug, slug),
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    }

    if (link.maxPurchases && link.purchaseCount >= link.maxPurchases) {
      return NextResponse.json({ error: "Purchase limit reached" }, { status: 410 });
    }

    // Hash the device fingerprint
    const fpHash = await hashFingerprint(deviceFingerprint);
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

    // Create guest purchase record
    const { sessionToken, purchaseId } = await createGuestSession({
      viewOnceLinkId: link.id,
      phoneNumber: sanitizedPhone,
      deviceFingerprint: fpHash,
      amountTzs: link.priceTzs,
      ipAddress,
    });

    // Provision ephemeral nTZS wallet for this guest
    const guestWallet = await ensureGuestNtzsWallet(sanitizedPhone);
    if (!guestWallet) {
      return NextResponse.json(
        { error: "Payment system temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    // Initiate M-Pesa deposit (STK push)
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
      purchaseId,
      depositId: depositResult.depositId,
      instructions: depositResult.instructions,
      amountTzs: link.priceTzs,
    });
  } catch (error) {
    console.error("Guest payment initiation error:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
