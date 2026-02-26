import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { walletTransactions, creatorWallets } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/webhooks/ntzs — Receive nTZS webhook events
 * Events: deposit.completed, transfer.completed, withdrawal.completed
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    console.log("[nTZS webhook] Event received:", event.event, event.data);

    switch (event.event) {
      case "deposit.completed": {
        // A deposit to a user's wallet was minted on-chain
        console.log("[nTZS webhook] Deposit completed:", event.data);
        break;
      }

      case "transfer.completed": {
        // An on-chain transfer between users was confirmed
        console.log("[nTZS webhook] Transfer completed:", event.data);
        break;
      }

      case "withdrawal.completed": {
        // Token burn + M-Pesa payout completed
        const { userId, amountTzs, txHash } = event.data || {};
        console.log("[nTZS webhook] Withdrawal completed:", { userId, amountTzs, txHash });
        break;
      }

      default:
        console.log("[nTZS webhook] Unknown event type:", event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[nTZS webhook] Error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
