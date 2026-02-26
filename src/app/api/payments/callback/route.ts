import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents, entitlements, content, profiles } from "@/db/schema";
import { creditCreatorWallet } from "@/lib/wallet";
import { activateWeeklySubscription } from "@/lib/subscription";
import { getNtzsClient } from "@/lib/ntzs";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const eventType = payload.type as string;
    const data = payload.data as {
      id: string;
      userId?: string;
      status?: string;
      amountTzs?: number;
      metadata?: { reference?: string; contentId?: string; fanProfileId?: string; type?: string };
    };

    console.log("nTZS payment webhook received:", eventType);

    // deposit.completed — fan topped up their wallet
    if (eventType === "deposit.completed" && data.metadata?.reference?.startsWith("sub_")) {
      const parts = data.metadata.reference.split("_");
      const profileId = parts[1];
      if (profileId) {
        await activateWeeklySubscription(profileId, data.metadata.reference);
        console.log("Subscription activated via nTZS deposit for profile:", profileId);
      }
      return NextResponse.json({ success: true });
    }

    // transfer.completed — content purchase (already handled synchronously in /initiate)
    // This is a safety net for any async transfers
    if (eventType === "transfer.completed" && data.metadata?.type === "content_purchase") {
      const { contentId, fanProfileId } = data.metadata;
      if (contentId && fanProfileId) {
        const existing = await db.query.entitlements.findFirst({
          where: (e, { and, eq }) =>
            and(eq(e.userId, fanProfileId), eq(e.contentId, contentId)),
        });
        if (!existing) {
          const intent = await db.query.paymentIntents.findFirst({
            where: (p, { and, eq }) =>
              and(eq(p.userId, fanProfileId), eq(p.contentId, contentId), eq(p.status, "paid")),
          });
          if (intent) {
            await db.insert(entitlements).values({
              userId: fanProfileId,
              contentId,
              paymentIntentId: intent.id,
            });
            console.log("Entitlement granted via transfer webhook:", { fanProfileId, contentId });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}

/**
 * Deposit creator's earning share into their nTZS on-chain wallet.
 * Uses the nTZS deposits API to mint tokens directly to the creator's wallet.
 * Non-blocking — failures are logged but don't affect the payment flow.
 */
async function mintToCreatorNtzsWallet(creatorId: string, amountTzs: number) {
  if (amountTzs <= 0) return;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, creatorId),
  });

  if (!profile?.ntzsUserId) {
    console.log("Creator has no nTZS wallet, skipping on-chain mint:", creatorId);
    return;
  }

  const ntzs = getNtzsClient();
  const deposit = await ntzs.deposits.create({
    userId: profile.ntzsUserId,
    amountTzs,
    phoneNumber: "system",
  });

  console.log("nTZS deposit minted to creator:", {
    creatorId,
    ntzsUserId: profile.ntzsUserId,
    amountTzs,
    depositId: deposit.id,
  });
}
