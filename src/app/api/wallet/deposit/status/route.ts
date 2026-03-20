import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getNtzsClient } from "@/lib/ntzs";

/**
 * GET /api/wallet/deposit/status?depositId=xxx
 * Check the status of a deposit
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get("depositId");

    if (!depositId) {
      return NextResponse.json(
        { error: "depositId is required" },
        { status: 400 }
      );
    }

    const ntzs = getNtzsClient();
    const deposit = await ntzs.deposits.get(depositId);

    return NextResponse.json({
      depositId: deposit.id,
      status: deposit.status,
      amountTzs: deposit.amountTzs,
      txHash: deposit.txHash,
    });
  } catch (error) {
    console.error("Deposit status check error:", error);
    return NextResponse.json(
      { error: "Failed to check deposit status" },
      { status: 500 }
    );
  }
}
