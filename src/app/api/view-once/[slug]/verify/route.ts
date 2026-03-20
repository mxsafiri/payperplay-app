/**
 * POST /api/view-once/[slug]/verify — Poll to check if M-Pesa payment completed.
 * Called by the client after STK push is sent.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestPurchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getNtzsClient } from "@/lib/ntzs";
import { completeGuestPurchase } from "@/lib/guest-payment";
import { activateGuestSession } from "@/lib/guest-session";

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

    // If already paid, return success
    if (purchase.status === "paid") {
      return NextResponse.json({ status: "paid", message: "Payment confirmed" });
    }

    // Check deposit status with nTZS
    const ntzs = getNtzsClient();
    const deposit = await ntzs.deposits.get(depositId);

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
        return NextResponse.json(
          { status: "failed", error: result.error },
          { status: 500 }
        );
      }

      // Activate the guest session cookie
      await activateGuestSession(purchaseId);

      return NextResponse.json({
        status: "paid",
        message: "Payment confirmed — enjoy the content!",
        transferId: result.transferId,
      });
    }

    // Unknown status
    return NextResponse.json({
      status: "pending",
      message: "Still processing...",
    });
  } catch (error) {
    console.error("Guest payment verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
