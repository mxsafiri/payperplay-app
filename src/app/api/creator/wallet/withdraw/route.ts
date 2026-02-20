import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { creatorWallets, walletTransactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { debitCreatorWallet } from "@/lib/wallet";
import { sendPayout, calculatePayoutFee } from "@/lib/payouts/snippe-payout";
import { eq, sql } from "drizzle-orm";

const MIN_WITHDRAWAL_TZS = 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const { amount, phoneNumber } = await req.json();

    if (!amount || !phoneNumber) {
      return NextResponse.json(
        { error: "Amount and phone number are required" },
        { status: 400 }
      );
    }

    if (amount < MIN_WITHDRAWAL_TZS) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${MIN_WITHDRAWAL_TZS.toLocaleString()} TZS` },
        { status: 400 }
      );
    }

    // Check wallet balance
    const wallet = await db.query.creatorWallets.findFirst({
      where: eq(creatorWallets.creatorId, profile.id),
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Debit wallet first (optimistic — marks tx as pending)
    const debitResult = await debitCreatorWallet({
      creatorId: profile.id,
      amountTzs: amount,
      description: `Withdrawal to ${phoneNumber}`,
      metadata: JSON.stringify({ phoneNumber }),
    });

    if (!debitResult.success) {
      return NextResponse.json(
        { error: debitResult.error || "Failed to process withdrawal" },
        { status: 400 }
      );
    }

    // Send payout via Snippe
    const payoutResult = await sendPayout({
      amount,
      recipientPhone: phoneNumber,
      recipientName: profile.displayName || profile.handle,
      narration: `PayPerPlay earnings withdrawal`,
      metadata: {
        creator_id: profile.id,
        wallet_transaction_id: debitResult.transactionId,
      },
    });

    if (!payoutResult.success) {
      // Refund: restore wallet balance and mark transaction as failed
      console.error("Payout initiation failed after debit:", payoutResult.error);
      try {
        await db
          .update(creatorWallets)
          .set({
            balance: sql`${creatorWallets.balance} + ${amount}`,
            totalWithdrawn: sql`${creatorWallets.totalWithdrawn} - ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(creatorWallets.creatorId, profile.id));

        if (debitResult.transactionId) {
          await db
            .update(walletTransactions)
            .set({
              status: "failed",
              description: `Withdrawal failed: ${payoutResult.error}`,
            })
            .where(eq(walletTransactions.id, debitResult.transactionId));
        }
        console.log("Wallet refunded after failed payout initiation");
      } catch (refundError) {
        console.error("CRITICAL: Failed to refund wallet after payout failure:", refundError);
      }

      return NextResponse.json(
        { error: payoutResult.error || "Payout failed — please try again" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: debitResult.transactionId,
      payoutReference: payoutResult.reference,
      amount,
      fees: payoutResult.fees,
      total: payoutResult.total,
      newBalance: debitResult.newBalance,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
