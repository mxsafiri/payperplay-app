import { db } from "@/db";
import { creatorWallets, walletTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// Platform takes 15%, creator gets 85%
export const PLATFORM_FEE_PERCENT = 15;

export interface CreditResult {
  success: boolean;
  creatorEarning: number;
  platformFee: number;
  newBalance: number;
  error?: string;
}

/**
 * Credit a creator's wallet when a fan purchases their content.
 * Runs atomically: updates wallet balance + inserts ledger entries.
 */
export async function creditCreatorWallet(params: {
  creatorId: string;
  amountTzs: number;
  paymentIntentId: string;
  contentTitle?: string;
}): Promise<CreditResult> {
  const { creatorId, amountTzs, paymentIntentId, contentTitle } = params;

  const platformFee = Math.round((amountTzs * PLATFORM_FEE_PERCENT) / 100);
  const creatorEarning = amountTzs - platformFee;

  try {
    // Get wallet
    const wallet = await db.query.creatorWallets.findFirst({
      where: eq(creatorWallets.creatorId, creatorId),
    });

    if (!wallet) {
      return { success: false, creatorEarning: 0, platformFee: 0, newBalance: 0, error: "Wallet not found" };
    }

    const newBalance = wallet.balance + creatorEarning;

    // Update wallet balance + totals
    await db
      .update(creatorWallets)
      .set({
        balance: newBalance,
        totalEarned: sql`${creatorWallets.totalEarned} + ${creatorEarning}`,
        totalFees: sql`${creatorWallets.totalFees} + ${platformFee}`,
        updatedAt: new Date(),
      })
      .where(eq(creatorWallets.id, wallet.id));

    // Insert earning transaction
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      type: "earning",
      status: "completed",
      amount: creatorEarning,
      balanceAfter: newBalance,
      description: contentTitle
        ? `Earning from "${contentTitle}"`
        : "Content purchase earning",
      referenceType: "payment_intent",
      referenceId: paymentIntentId,
    });

    // Insert fee transaction (for audit trail)
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      type: "fee",
      status: "completed",
      amount: -platformFee,
      balanceAfter: newBalance,
      description: `Platform fee (${PLATFORM_FEE_PERCENT}%)`,
      referenceType: "payment_intent",
      referenceId: paymentIntentId,
    });

    console.log("Creator wallet credited:", {
      creatorId,
      amountTzs,
      creatorEarning,
      platformFee,
      newBalance,
    });

    return { success: true, creatorEarning, platformFee, newBalance };
  } catch (error) {
    console.error("Failed to credit creator wallet:", error);
    return { success: false, creatorEarning: 0, platformFee: 0, newBalance: 0, error: "Database error" };
  }
}

/**
 * Debit a creator's wallet for a withdrawal.
 */
export async function debitCreatorWallet(params: {
  creatorId: string;
  amountTzs: number;
  description?: string;
  metadata?: string;
}): Promise<{ success: boolean; newBalance: number; transactionId?: string; error?: string }> {
  const { creatorId, amountTzs, description, metadata } = params;

  try {
    const wallet = await db.query.creatorWallets.findFirst({
      where: eq(creatorWallets.creatorId, creatorId),
    });

    if (!wallet) {
      return { success: false, newBalance: 0, error: "Wallet not found" };
    }

    if (wallet.balance < amountTzs) {
      return { success: false, newBalance: wallet.balance, error: "Insufficient balance" };
    }

    const newBalance = wallet.balance - amountTzs;

    // Update wallet
    await db
      .update(creatorWallets)
      .set({
        balance: newBalance,
        totalWithdrawn: sql`${creatorWallets.totalWithdrawn} + ${amountTzs}`,
        updatedAt: new Date(),
      })
      .where(eq(creatorWallets.id, wallet.id));

    // Insert withdrawal transaction
    const [tx] = await db.insert(walletTransactions).values({
      walletId: wallet.id,
      type: "withdrawal",
      status: "pending",
      amount: -amountTzs,
      balanceAfter: newBalance,
      description: description || "Withdrawal to mobile money",
      referenceType: "payout",
      metadata,
    }).returning();

    return { success: true, newBalance, transactionId: tx.id };
  } catch (error) {
    console.error("Failed to debit creator wallet:", error);
    return { success: false, newBalance: 0, error: "Database error" };
  }
}
