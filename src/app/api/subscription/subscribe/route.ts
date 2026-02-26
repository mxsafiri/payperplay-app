import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { getNtzsClient } from "@/lib/ntzs";
import { ensureNtzsWallet } from "@/lib/ntzs-provision";
import { activateWeeklySubscription, WEEKLY_PRICE_TZS } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Ensure user has an nTZS wallet
    const ntzsUserId = await ensureNtzsWallet(profile.id);
    if (!ntzsUserId) {
      return NextResponse.json({ error: "Wallet not available. Please try again." }, { status: 400 });
    }

    // Check if user already has enough balance to pay subscription directly
    const ntzs = getNtzsClient();
    const { balanceTzs } = await ntzs.users.getBalance(ntzsUserId);

    if (balanceTzs >= WEEKLY_PRICE_TZS) {
      // Pay from existing nTZS balance — activate immediately
      const reference = `sub_${profile.id}_${Date.now()}`;
      await activateWeeklySubscription(profile.id, reference);

      return NextResponse.json({
        success: true,
        reference,
        paidFromBalance: true,
        amount: WEEKLY_PRICE_TZS,
        message: "Subscription activated from wallet balance",
      });
    }

    // Not enough balance — initiate M-Pesa top-up via nTZS deposit
    const deposit = await ntzs.deposits.create({
      userId: ntzsUserId,
      amountTzs: WEEKLY_PRICE_TZS,
      phoneNumber,
    });

    return NextResponse.json({
      success: true,
      depositId: deposit.id,
      paidFromBalance: false,
      instructions: deposit.instructions || `Pay TZS ${WEEKLY_PRICE_TZS.toLocaleString()} via M-Pesa to complete subscription`,
      amount: WEEKLY_PRICE_TZS,
      message: "M-Pesa push sent — subscription activates on payment confirmation",
    });
  } catch (error) {
    console.error("Subscription payment error:", error);
    return NextResponse.json({ error: "Failed to process subscription payment" }, { status: 500 });
  }
}
