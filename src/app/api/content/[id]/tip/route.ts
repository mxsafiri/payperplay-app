import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { content } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getNtzsClient, NtzsApiError } from "@/lib/ntzs";
import { ensureNtzsWallet } from "@/lib/ntzs-provision";
import { creditCreatorWallet } from "@/lib/wallet";

const MIN_TIP = 100;
const MAX_TIP = 500_000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amountTzs } = await req.json();
    if (!amountTzs || typeof amountTzs !== "number") {
      return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 });
    }
    if (amountTzs < MIN_TIP) {
      return NextResponse.json({ error: `Minimum tip is ${MIN_TIP} TZS` }, { status: 400 });
    }
    if (amountTzs > MAX_TIP) {
      return NextResponse.json({ error: `Maximum tip is ${MAX_TIP.toLocaleString()} TZS` }, { status: 400 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const contentItem = await db.query.content.findFirst({
      where: eq(content.id, contentId),
      with: { creator: true },
    });
    if (!contentItem) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    // Can't tip yourself
    if (contentItem.creatorId === profile.id) {
      return NextResponse.json({ error: "You can't tip your own content" }, { status: 400 });
    }

    // Ensure fan has nTZS wallet
    const ntzsUserId = await ensureNtzsWallet(profile.id);
    if (!ntzsUserId) {
      return NextResponse.json({ error: "Wallet not available. Please try again." }, { status: 400 });
    }

    // Check fan balance
    const ntzs = getNtzsClient();
    const { balanceTzs } = await ntzs.users.getBalance(ntzsUserId);
    if (balanceTzs < amountTzs) {
      return NextResponse.json(
        { error: "Insufficient wallet balance", required: amountTzs, balance: balanceTzs },
        { status: 402 }
      );
    }

    // Platform fee: 15%, creator gets 85%
    const platformFee = Math.round(amountTzs * 0.15);
    const creatorAmount = amountTzs - platformFee;

    // Get or provision creator nTZS wallet
    const creatorNtzsUserId =
      (contentItem.creator as { ntzsUserId?: string | null } | null)?.ntzsUserId ||
      (await ensureNtzsWallet(contentItem.creatorId));

    // Execute nTZS transfer
    let transferId = `tip_local_${Date.now()}`;
    if (creatorNtzsUserId) {
      try {
        const transfer = await ntzs.transfers.create({
          fromUserId: ntzsUserId,
          toUserId: creatorNtzsUserId,
          amountTzs: creatorAmount,
        });
        transferId = transfer.id;
      } catch (err) {
        const msg = err instanceof NtzsApiError ? err.message : String(err);
        if (msg.includes("Insufficient balance") || msg.includes("insufficient funds")) {
          return NextResponse.json(
            { error: "Insufficient wallet balance", required: amountTzs, balance: balanceTzs },
            { status: 402 }
          );
        }
        return NextResponse.json({ error: `Tip failed: ${msg}` }, { status: 500 });
      }
    }

    // Credit creator ledger
    await creditCreatorWallet({
      creatorId: contentItem.creatorId,
      amountTzs,
      paymentIntentId: transferId,
      contentTitle: `Tip on "${contentItem.title}"`,
    });

    return NextResponse.json({
      success: true,
      transferId,
      amountTzs,
      creatorAmount,
    });
  } catch (error) {
    console.error("Tip error:", error);
    return NextResponse.json({ error: "Failed to send tip" }, { status: 500 });
  }
}
