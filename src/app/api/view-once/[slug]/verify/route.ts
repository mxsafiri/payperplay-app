/**
 * POST /api/view-once/[slug]/verify — Poll to check if M-Pesa payment completed.
 * Called by the client after STK push is sent.
 *
 * IMPORTANT: Cookies are set directly on the NextResponse object because
 * `cookies().set()` from next/headers doesn't reliably attach to custom
 * NextResponse.json() responses in Route Handlers.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestPurchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getNtzsClient } from "@/lib/ntzs";
import { completeGuestPurchase } from "@/lib/guest-payment";

const GUEST_COOKIE_NAME = "pp_guest_session";
const SESSION_DURATION_HOURS = 4;

/** Set the guest session cookie directly on the NextResponse */
function setSessionCookie(response: NextResponse, purchaseId: string) {
  response.cookies.set(GUEST_COOKIE_NAME, purchaseId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
  return response;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await req.json();
    const { purchaseId, depositId } = body;

    if (!purchaseId || !depositId) {
      return NextResponse.json(
        { error: "purchaseId and depositId are required" },
        { status: 400 }
      );
    }

    // Look up the purchase
    const purchase = await db.query.guestPurchases.findFirst({
      where: eq(guestPurchases.id, purchaseId),
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // If already paid, re-set the cookie (client may have missed first response)
    if (purchase.status === "paid") {
      const res = NextResponse.json({ status: "paid", message: "Payment confirmed", purchaseId });
      return setSessionCookie(res, purchaseId);
    }

    // If expired/failed, stop polling
    if (purchase.status === "expired") {
      return NextResponse.json(
        { status: "failed", error: "Payment was not completed in time" },
        { status: 402 }
      );
    }

    // Check deposit status with nTZS
    const ntzs = getNtzsClient();
    let deposit;
    try {
      deposit = await ntzs.deposits.get(depositId);
    } catch (err) {
      console.error("[verify] Failed to check deposit status:", err);
      // Don't error out — let client keep polling
      return NextResponse.json({
        status: "pending",
        message: "Checking payment status...",
      });
    }

    if (deposit.status === "pending" || deposit.status === "processing") {
      return NextResponse.json({
        status: "pending",
        message: "Waiting for M-Pesa confirmation...",
      });
    }

    if (deposit.status === "failed") {
      // Mark purchase as expired
      await db
        .update(guestPurchases)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(guestPurchases.id, purchaseId));

      return NextResponse.json(
        { status: "failed", error: "M-Pesa payment was not completed" },
        { status: 402 }
      );
    }

    // Deposit completed — execute the transfer and activate session
    if (deposit.status === "completed" || deposit.status === "success") {
      const result = await completeGuestPurchase(purchaseId);

      if (!result.success) {
        console.error("[verify] completeGuestPurchase failed:", result.error);
        return NextResponse.json(
          { status: "failed", error: "Payment received but failed to process. Contact support." },
          { status: 500 }
        );
      }

      // Set the session cookie directly on the response
      const res = NextResponse.json({
        status: "paid",
        message: "Payment confirmed — enjoy the content!",
        transferId: result.transferId,
        purchaseId,
      });
      return setSessionCookie(res, purchaseId);
    }

    // Unknown status — keep polling
    return NextResponse.json({
      status: "pending",
      message: "Still processing...",
    });
  } catch (error) {
    console.error("Guest payment verification error:", error);
    // Return pending (not 500) so client keeps polling instead of dying
    return NextResponse.json({
      status: "pending",
      message: "Checking payment...",
    });
  }
}
