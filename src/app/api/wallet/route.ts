import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getNtzsClient } from "@/lib/ntzs";
import { ensureNtzsWallet } from "@/lib/ntzs-provision";

/**
 * GET /api/wallet — Get current user's nTZS wallet balance and address
 */
export async function GET() {
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

    // Lazy-provision nTZS wallet for existing users
    if (!profile.ntzsUserId) {
      const ntzsUserId = await ensureNtzsWallet(profile.id);
      if (!ntzsUserId) {
        return NextResponse.json({
          wallet: {
            provisioned: false,
            balanceTzs: 0,
            walletAddress: null,
          },
        });
      }
      profile.ntzsUserId = ntzsUserId;
    }

    // Fetch live balance from nTZS
    try {
      const ntzs = getNtzsClient();
      const { balanceTzs, walletAddress } = await ntzs.users.getBalance(profile.ntzsUserId);

      return NextResponse.json({
        wallet: {
          provisioned: true,
          balanceTzs,
          walletAddress,
          ntzsUserId: profile.ntzsUserId,
        },
      });
    } catch (ntzsErr) {
      console.error("Failed to fetch nTZS balance:", ntzsErr);
      // Fallback to stored wallet address
      return NextResponse.json({
        wallet: {
          provisioned: true,
          balanceTzs: 0,
          walletAddress: profile.ntzsWalletAddress,
          ntzsUserId: profile.ntzsUserId,
          balanceUnavailable: true,
        },
      });
    }
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
  }
}
