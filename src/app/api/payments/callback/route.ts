import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents, entitlements, content } from "@/db/schema";
import { paymentProvider } from "@/lib/payments";
import { SnippePaymentProvider } from "@/lib/payments/providers/snippe-provider";
import { creditCreatorWallet } from "@/lib/wallet";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Snippe webhook signature if using Snippe provider
    if (paymentProvider.name === "snippe") {
      const signature = req.headers.get("x-webhook-signature") || "";
      const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "";

      if (webhookSecret && !SnippePaymentProvider.verifySignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);

    // Verify and parse callback from payment provider
    const callbackResult = paymentProvider.verifyCallback(payload);

    // Find payment intent by reference
    const paymentIntent = await db.query.paymentIntents.findFirst({
      where: eq(paymentIntents.id, callbackResult.reference),
    });

    if (!paymentIntent) {
      console.error("Payment intent not found:", callbackResult.reference);
      return NextResponse.json(
        { error: "Payment intent not found" },
        { status: 404 }
      );
    }

    // Update payment intent status
    await db
      .update(paymentIntents)
      .set({
        status: callbackResult.status,
        paidAt: callbackResult.status === "paid" ? callbackResult.timestamp : null,
        metadata: JSON.stringify(callbackResult.metadata),
      })
      .where(eq(paymentIntents.id, paymentIntent.id));

    // If payment successful, grant entitlement (idempotent)
    if (callbackResult.status === "paid") {
      // Check if entitlement already exists
      const existingEntitlement = await db.query.entitlements.findFirst({
        where: (entitlements, { and, eq }) =>
          and(
            eq(entitlements.userId, paymentIntent.userId),
            eq(entitlements.contentId, paymentIntent.contentId)
          ),
      });

      if (!existingEntitlement) {
        // Grant access
        await db.insert(entitlements).values({
          userId: paymentIntent.userId,
          contentId: paymentIntent.contentId,
          paymentIntentId: paymentIntent.id,
        });

        // Credit creator's wallet (85% of payment, 15% platform fee)
        const contentItem = await db.query.content.findFirst({
          where: eq(content.id, paymentIntent.contentId),
        });

        if (contentItem) {
          const result = await creditCreatorWallet({
            creatorId: contentItem.creatorId,
            amountTzs: paymentIntent.amountTzs,
            paymentIntentId: paymentIntent.id,
            contentTitle: contentItem.title,
          });

          if (!result.success) {
            console.error("Failed to credit creator wallet:", result.error);
          }
        }

        console.log("Entitlement granted:", {
          userId: paymentIntent.userId,
          contentId: paymentIntent.contentId,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}
