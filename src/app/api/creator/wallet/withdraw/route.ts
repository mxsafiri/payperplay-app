import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { creatorWallets, walletTransactions, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { debitCreatorWallet } from "@/lib/wallet";
import { getNtzsClient } from "@/lib/ntzs";
import { ensureNtzsWallet } from "@/lib/ntzs-provision";
import { eq, sql } from "drizzle-orm";

const MIN_WITHDRAWAL_TZS = 5000;

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

    // Lazy-provision nTZS wallet if needed
    if (!profile.ntzsUserId) {
      const ntzsUserId = await ensureNtzsWallet(profile.id);
      if (!ntzsUserId) {
        return NextResponse.json(
          { error: "nTZS wallet could not be provisioned. Please try again later." },
          { status: 400 }
        );
      }
      profile.ntzsUserId = ntzsUserId;
    }

    // Debit internal wallet first (optimistic — marks tx as pending)
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

    // Send withdrawal via nTZS (burns tokens + sends M-Pesa payout)
    try {
      const ntzs = getNtzsClient();
      const withdrawal = await ntzs.withdrawals.create({
        userId: profile.ntzsUserId,
        amountTzs: amount,
        phoneNumber,
      });

      // Mark internal transaction as completed
      if (debitResult.transactionId) {
        await db
          .update(walletTransactions)
          .set({
            status: "completed",
            metadata: JSON.stringify({ phoneNumber, ntzsWithdrawalId: withdrawal.id }),
          })
          .where(eq(walletTransactions.id, debitResult.transactionId));
      }

      return NextResponse.json({
        success: true,
        transactionId: debitResult.transactionId,
        ntzsWithdrawalId: withdrawal.id,
        amount,
        newBalance: debitResult.newBalance,
      });
    } catch (ntzsError) {
      // Refund: restore wallet balance and mark transaction as failed
      console.error("nTZS withdrawal failed after debit:", ntzsError);
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
              description: `Withdrawal failed: ${ntzsError instanceof Error ? ntzsError.message : "Unknown error"}`,
            })
            .where(eq(walletTransactions.id, debitResult.transactionId));
        }
        console.log("Wallet refunded after failed nTZS withdrawal");
      } catch (refundError) {
        console.error("CRITICAL: Failed to refund wallet after nTZS withdrawal failure:", refundError);
      }

      return NextResponse.json(
        { error: "Withdrawal failed — please try again" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
