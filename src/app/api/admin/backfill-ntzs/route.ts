import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, creatorWallets } from "@/db/schema";
import { getNtzsClient, NtzsApiError } from "@/lib/ntzs";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/backfill-ntzs
 * One-time migration: provision nTZS wallets for all existing creators
 * and mint their current internal ledger balance to nTZS on-chain.
 *
 * Protected by ADMIN_SECRET env var.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ntzs = getNtzsClient();
  const results: Array<{
    profileId: string;
    handle: string;
    status: "provisioned" | "already_provisioned" | "minted" | "skipped" | "error";
    ntzsUserId?: string;
    balanceTzs?: number;
    depositId?: string;
    error?: string;
  }> = [];

  // Get all creator profiles with their wallets
  const creatorProfiles = await db.query.profiles.findMany({
    where: (p, { eq }) => eq(p.role, "creator"),
  });

  for (const profile of creatorProfiles) {
    try {
      let ntzsUserId = profile.ntzsUserId;

      // Step 1: Provision nTZS wallet if not already done
      if (!ntzsUserId) {
        const ntzsUser = await ntzs.users.create({
          externalId: profile.id,
          email: `${profile.handle}@payperplay.xyz`,
        });

        ntzsUserId = ntzsUser.id;

        await db
          .update(profiles)
          .set({
            ntzsUserId: ntzsUser.id,
            ntzsWalletAddress: ntzsUser.walletAddress,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, profile.id));

        results.push({
          profileId: profile.id,
          handle: profile.handle,
          status: "provisioned",
          ntzsUserId: ntzsUser.id,
        });
      } else {
        results.push({
          profileId: profile.id,
          handle: profile.handle,
          status: "already_provisioned",
          ntzsUserId,
        });
      }

      // Step 2: Get internal ledger balance
      const wallet = await db.query.creatorWallets.findFirst({
        where: eq(creatorWallets.creatorId, profile.id),
      });

      const balance = wallet?.balance ?? 0;

      if (balance <= 0) {
        results[results.length - 1].status =
          results[results.length - 1].status === "provisioned"
            ? "provisioned"
            : "skipped";
        results[results.length - 1].balanceTzs = 0;
        continue;
      }

      // Step 3: Skip if balance below nTZS minimum deposit (500 TZS)
      if (balance < 500) {
        results[results.length - 1].status = "skipped";
        results[results.length - 1].balanceTzs = balance;
        continue;
      }

      // Step 4: Check current nTZS on-chain balance to avoid double-minting
      const onChainBalance = await ntzs.users.getBalance(ntzsUserId);
      if (onChainBalance.balanceTzs >= balance) {
        results[results.length - 1].status = "skipped";
        results[results.length - 1].balanceTzs = balance;
        continue;
      }

      // Step 5: Mint the difference to nTZS (admin credit — no phone needed)
      const mintAmount = balance - onChainBalance.balanceTzs;
      const deposit = await ntzs.deposits.create({
        userId: ntzsUserId,
        amountTzs: mintAmount,
        phoneNumber: "0712345678",
      });

      results[results.length - 1].status = "minted";
      results[results.length - 1].balanceTzs = mintAmount;
      results[results.length - 1].depositId = deposit.id;

      console.log("Backfill minted:", {
        handle: profile.handle,
        ntzsUserId,
        mintAmount,
        depositId: deposit.id,
      });
    } catch (err) {
      const message = err instanceof NtzsApiError
        ? `nTZS ${err.status}: ${err.message}`
        : String(err);

      results.push({
        profileId: profile.id,
        handle: profile.handle,
        status: "error",
        error: message,
      });

      console.error("Backfill error for", profile.handle, message);
    }
  }

  const summary = {
    total: results.length,
    provisioned: results.filter((r) => r.status === "provisioned").length,
    alreadyProvisioned: results.filter((r) => r.status === "already_provisioned").length,
    minted: results.filter((r) => r.status === "minted").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results });
}
