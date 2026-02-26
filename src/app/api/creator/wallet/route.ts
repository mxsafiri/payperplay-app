import { NextResponse } from "next/server";
import { db } from "@/db";
import { creatorWallets, walletTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getNtzsClient } from "@/lib/ntzs";
import { ensureNtzsWallet } from "@/lib/ntzs-provision";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    // Get wallet
    const wallet = await db.query.creatorWallets.findFirst({
      where: eq(creatorWallets.creatorId, profile.id),
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Get recent transactions (last 20)
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(20);

    // Lazy-provision nTZS wallet for existing creators
    if (!profile.ntzsUserId) {
      await ensureNtzsWallet(profile.id).catch(() => {});
    }

    // Fetch nTZS on-chain balance if provisioned
    let ntzsBalance = 0;
    let ntzsWalletAddress = profile.ntzsWalletAddress || null;
    if (profile.ntzsUserId) {
      try {
        const ntzs = getNtzsClient();
        const bal = await ntzs.users.getBalance(profile.ntzsUserId);
        ntzsBalance = bal.balanceTzs;
        ntzsWalletAddress = bal.walletAddress;
      } catch {
        // Non-fatal — fall back to 0
      }
    }

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        totalFees: wallet.totalFees,
        ntzsBalance,
        ntzsWalletAddress,
      },
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}
