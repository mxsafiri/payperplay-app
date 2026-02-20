import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { walletTransactions, creatorWallets } from "@/db/schema";
import { SnippePaymentProvider } from "@/lib/payments/providers/snippe-provider";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify webhook signature
    const signature = req.headers.get("x-webhook-signature") || "";
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "";

    if (webhookSecret && !SnippePaymentProvider.verifySignature(rawBody, signature, webhookSecret)) {
      console.error("Invalid payout webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type as string;
    const data = payload.data as {
      reference: string;
      status: string;
      failure_reason?: string;
      metadata?: { wallet_transaction_id?: string; creator_id?: string };
    };

    console.log("Payout webhook received:", { eventType, reference: data.reference, status: data.status });

    const walletTxId = data.metadata?.wallet_transaction_id;
    if (!walletTxId) {
      console.error("No wallet_transaction_id in payout metadata");
      return NextResponse.json({ success: true });
    }

    if (eventType === "payout.completed") {
      // Mark the wallet transaction as completed
      await db
        .update(walletTransactions)
        .set({ status: "completed" })
        .where(eq(walletTransactions.id, walletTxId));

      console.log("Payout completed, wallet tx updated:", walletTxId);
    } else if (eventType === "payout.failed") {
      // Mark the wallet transaction as failed
      await db
        .update(walletTransactions)
        .set({
          status: "failed",
          description: `Withdrawal failed: ${data.failure_reason || "Unknown error"}`,
        })
        .where(eq(walletTransactions.id, walletTxId));

      // Refund the creator's wallet balance
      const tx = await db.query.walletTransactions.findFirst({
        where: eq(walletTransactions.id, walletTxId),
      });

      if (tx) {
        const refundAmount = Math.abs(tx.amount);

        await db
          .update(creatorWallets)
          .set({
            balance: sql`${creatorWallets.balance} + ${refundAmount}`,
            totalWithdrawn: sql`${creatorWallets.totalWithdrawn} - ${refundAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(creatorWallets.id, tx.walletId));

        // Insert refund transaction
        const wallet = await db.query.creatorWallets.findFirst({
          where: eq(creatorWallets.id, tx.walletId),
        });

        await db.insert(walletTransactions).values({
          walletId: tx.walletId,
          type: "refund",
          status: "completed",
          amount: refundAmount,
          balanceAfter: (wallet?.balance || 0) + refundAmount,
          description: `Refund: withdrawal failed — ${data.failure_reason || "Unknown error"}`,
          referenceType: "payout",
          referenceId: walletTxId,
        });

        console.log("Payout failed, balance refunded:", { walletTxId, refundAmount });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payout callback error:", error);
    return NextResponse.json({ error: "Failed to process callback" }, { status: 500 });
  }
}
