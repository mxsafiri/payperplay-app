import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents, entitlements, content, platformSubscriptions } from "@/db/schema";
import { paymentProvider } from "@/lib/payments";
import { SnippePaymentProvider } from "@/lib/payments/providers/snippe-provider";
import { creditCreatorWallet } from "@/lib/wallet";
import { activateWeeklySubscription } from "@/lib/subscription";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Log all incoming headers to identify correct signature header name
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = key.toLowerCase().includes("sig") || key.toLowerCase().includes("webhook")
        ? value
        : value.slice(0, 30) + "...";
    });
    console.log("Webhook headers:", JSON.stringify(allHeaders));
    console.log("Webhook body (first 200 chars):", rawBody.slice(0, 200));

    // Try multiple possible signature header names
    const signature =
      req.headers.get("x-webhook-signature") ||
      req.headers.get("x-snippe-signature") ||
      req.headers.get("webhook-signature") ||
      req.headers.get("x-signature") ||
      "";
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "";

    console.log("Signature header value:", signature ? signature.slice(0, 20) + "..." : "(empty)");
    console.log("Webhook secret configured:", webhookSecret ? "yes (" + webhookSecret.slice(0, 8) + "...)" : "NO");

    if (!webhookSecret) {
      console.error("PAYMENT_WEBHOOK_SECRET is not configured — rejecting callback");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    // Compute expected signature for debugging
    const crypto = await import("crypto");
    const expectedSig = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    console.log("Expected signature:", expectedSig.slice(0, 20) + "...");
    console.log("Received signature:", signature.slice(0, 20) + "...");
    console.log("Signatures match:", expectedSig === signature);

    if (!SnippePaymentProvider.verifySignature(rawBody, signature, webhookSecret)) {
      console.error("Invalid webhook signature — REJECTING (will retry)");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log("Webhook signature verified successfully!");

    const payload = JSON.parse(rawBody);

    // Verify and parse callback from payment provider
    const callbackResult = paymentProvider.verifyCallback(payload);

    // Handle subscription payments (reference starts with "sub_")
    if (callbackResult.reference.startsWith("sub_") && callbackResult.status === "paid") {
      // Extract profileId from reference: sub_{profileId}_{timestamp}
      const parts = callbackResult.reference.split("_");
      const profileId = parts[1];
      if (profileId) {
        await activateWeeklySubscription(profileId, callbackResult.reference);
        console.log("Subscription activated via callback for profile:", profileId);
      }
      return NextResponse.json({ success: true });
    }

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
