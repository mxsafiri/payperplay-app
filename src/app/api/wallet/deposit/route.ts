import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getNtzsClient } from "@/lib/ntzs";

/**
 * POST /api/wallet/deposit — Initiate nTZS deposit (M-Pesa on-ramp)
 * Body: { amountTzs: number, phoneNumber: string }
 */
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

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.ntzsUserId) {
      return NextResponse.json(
        { error: "Wallet not provisioned yet. Please try again in a moment." },
        { status: 400 }
      );
    }

    const { amountTzs, phoneNumber } = await req.json();

    if (!amountTzs || !phoneNumber) {
      return NextResponse.json(
        { error: "amountTzs and phoneNumber are required" },
        { status: 400 }
      );
    }

    if (amountTzs < 500) {
      return NextResponse.json(
        { error: "Minimum deposit is 500 TZS" },
        { status: 400 }
      );
    }

    const ntzs = getNtzsClient();
    const deposit = await ntzs.deposits.create({
      userId: profile.ntzsUserId,
      amountTzs,
      phoneNumber,
    });

    return NextResponse.json({
      success: true,
      depositId: deposit.id,
      status: deposit.status,
      instructions: deposit.instructions || "Check your phone for the M-Pesa prompt",
    });
  } catch (error) {
    console.error("Wallet deposit error:", error);
    return NextResponse.json(
      { error: "Failed to initiate deposit" },
      { status: 500 }
    );
  }
}
