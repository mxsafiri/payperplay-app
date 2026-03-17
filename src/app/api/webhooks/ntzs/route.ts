import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { walletTransactions, entitlements, paymentIntents, platformSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { activateWeeklySubscription } from "@/lib/subscription";

/**
 * POST /api/webhooks/ntzs — Primary nTZS event receiver
 *
 * Handles:
 *   deposit.completed    — fan top-up confirmed on-chain
 *   transfer.completed   — content purchase safety net
 *   withdrawal.completed — creator token burn + M-Pesa payout confirmed
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);
    const eventType = (event.event || event.type) as string;
    const data = event.data || {};

    console.log("[webhooks/ntzs] Event received:", eventType);

    switch (eventType) {
      // ── deposit.completed ───────────────────────────────────────────────────
      // Fan topped up their wallet. If the deposit reference starts with "sub_",
      // activate their weekly subscription.
      case "deposit.completed": {
        const reference = data.metadata?.reference as string | undefined;
        if (reference?.startsWith("sub_")) {
          const profileId = reference.split("_")[1];
          if (profileId) {
            // Idempotency check
            const existing = await db.query.platformSubscriptions.findFirst({
              where: and(
                eq(platformSubscriptions.profileId, profileId),
                eq(platformSubscriptions.paymentIntentId, reference)
              ),
            });
            if (!existing) {
              await activateWeeklySubscription(profileId, reference);
              console.log("[webhooks/ntzs] Subscription activated for profile:", profileId);
            } else {
              console.log("[webhooks/ntzs] Duplicate deposit event, subscription already active:", profileId);
            }
          }
        } else {
          console.log("[webhooks/ntzs] Deposit completed (no subscription action):", data.id);
        }
        break;
      }

      // ── transfer.completed ──────────────────────────────────────────────────
      // Content purchase safety net — primary flow is synchronous in /api/payments/initiate.
      // Grant entitlement here if it was somehow missed.
      case "transfer.completed": {
        const { contentId, fanProfileId } = data.metadata || {};
        if (data.metadata?.type === "content_purchase" && contentId && fanProfileId) {
          const existing = await db.query.entitlements.findFirst({
            where: (e, { and, eq }) =>
              and(eq(e.userId, fanProfileId), eq(e.contentId, contentId)),
          });
          if (!existing) {
            const intent = await db.query.paymentIntents.findFirst({
              where: (p, { and, eq }) =>
                and(eq(p.userId, fanProfileId), eq(p.contentId, contentId), eq(p.status, "paid")),
            });
            if (intent) {
              await db.insert(entitlements).values({
                userId: fanProfileId,
                contentId,
                paymentIntentId: intent.id,
              });
              console.log("[webhooks/ntzs] Entitlement granted via transfer webhook:", { fanProfileId, contentId });
            }
          }
        }
        break;
      }

      // ── withdrawal.completed ────────────────────────────────────────────────
      // Token burn + M-Pesa payout confirmed on-chain.
      // Mark the wallet transaction as completed (idempotent).
      case "withdrawal.completed": {
        const walletTxId = data.metadata?.wallet_transaction_id as string | undefined;
        if (!walletTxId) {
          console.warn("[webhooks/ntzs] withdrawal.completed missing wallet_transaction_id:", data);
          break;
        }

        const tx = await db.query.walletTransactions.findFirst({
          where: eq(walletTransactions.id, walletTxId),
        });

        if (!tx) {
          console.warn("[webhooks/ntzs] withdrawal.completed — wallet tx not found:", walletTxId);
          break;
        }

        if (tx.status === "pending") {
          await db
            .update(walletTransactions)
            .set({ status: "completed" })
            .where(eq(walletTransactions.id, walletTxId));
          console.log("[webhooks/ntzs] Withdrawal marked completed:", walletTxId);
        } else {
          console.log("[webhooks/ntzs] Withdrawal already processed, skipping:", { walletTxId, status: tx.status });
        }
        break;
      }

      default:
        console.log("[webhooks/ntzs] Unknown event type:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhooks/ntzs] Error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
