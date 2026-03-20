/**
 * Guest payment flow for view-once links.
 * Provisions an ephemeral nTZS wallet for the guest, initiates M-Pesa deposit,
 * then transfers funds to the creator on confirmation.
 */
import { getNtzsClient, NtzsApiError } from "@/lib/ntzs";
import { creditCreatorWallet } from "@/lib/wallet";
import { db } from "@/db";
import { guestPurchases, viewOnceLinks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Provision an ephemeral nTZS wallet for a guest phone number.
 * Uses a deterministic externalId so the same phone reuses the same wallet.
 */
export async function ensureGuestNtzsWallet(
  phoneNumber: string
): Promise<{ ntzsUserId: string } | null> {
  const ntzs = getNtzsClient();
  const sanitizedPhone = phoneNumber.replace(/[^0-9+]/g, "");
  const externalId = `guest_${sanitizedPhone}`;
  const email = `guest-${sanitizedPhone}@payperplay.xyz`;

  try {
    // Try to create — will fail if already exists
    const user = await ntzs.users.create({
      externalId,
      email,
      phone: sanitizedPhone,
    });
    return { ntzsUserId: user.id };
  } catch (err) {
    if (err instanceof NtzsApiError && err.status === 409) {
      // Already exists — look up by external ID
      // The nTZS API should return the existing user on conflict
      // For now, we can extract from the error or try a different approach
      try {
        // Try creating with a slightly different approach - get existing
        const body = err.body as { user?: { id: string } };
        if (body?.user?.id) {
          return { ntzsUserId: body.user.id };
        }
      } catch {
        // fall through
      }
    }
    console.error("[guest-payment] Failed to provision guest wallet:", err);
    return null;
  }
}

/**
 * Initiate a deposit (M-Pesa STK push) for a guest purchase.
 */
export async function initiateGuestDeposit(params: {
  ntzsGuestUserId: string;
  phoneNumber: string;
  amountTzs: number;
  purchaseId: string;
}): Promise<{ depositId: string; instructions?: string } | { error: string }> {
  const ntzs = getNtzsClient();

  try {
    const deposit = await ntzs.deposits.create({
      userId: params.ntzsGuestUserId,
      amountTzs: params.amountTzs,
      phoneNumber: params.phoneNumber,
    });

    // Store the deposit ID and guest nTZS user ID on the purchase
    await db
      .update(guestPurchases)
      .set({
        depositId: deposit.id,
        ntzsGuestUserId: params.ntzsGuestUserId,
        updatedAt: new Date(),
      })
      .where(eq(guestPurchases.id, params.purchaseId));

    return {
      depositId: deposit.id,
      instructions: deposit.instructions || "Check your phone for the M-Pesa prompt",
    };
  } catch (err) {
    const msg = err instanceof NtzsApiError ? err.message : String(err);
    console.error("[guest-payment] Deposit initiation failed:", msg);
    return { error: msg };
  }
}

/**
 * Complete a guest purchase after deposit is confirmed.
 * Transfers funds from guest wallet to creator wallet.
 */
export async function completeGuestPurchase(purchaseId: string): Promise<
  { success: true; transferId: string } | { success: false; error: string }
> {
  const purchase = await db.query.guestPurchases.findFirst({
    where: eq(guestPurchases.id, purchaseId),
  });

  if (!purchase) return { success: false, error: "Purchase not found" };
  if (purchase.status !== "pending") return { success: false, error: "Purchase already processed" };
  if (!purchase.ntzsGuestUserId) return { success: false, error: "Guest wallet not provisioned" };

  // Get the link to find the creator
  const link = await db.query.viewOnceLinks.findFirst({
    where: eq(viewOnceLinks.id, purchase.viewOnceLinkId),
    with: { content: true },
  });

  if (!link) return { success: false, error: "Link not found" };

  // Get creator's nTZS user ID
  const creatorProfile = await db.query.profiles.findFirst({
    where: (profiles, { eq: e }) => e(profiles.id, link.creatorId),
  });

  if (!creatorProfile?.ntzsUserId) {
    return { success: false, error: "Creator wallet not available" };
  }

  const ntzs = getNtzsClient();
  const platformFee = Math.round(purchase.amountTzs * 0.15);
  const creatorEarning = purchase.amountTzs - platformFee;

  try {
    // Transfer: guest → creator (85%)
    const transfer = await ntzs.transfers.create({
      fromUserId: purchase.ntzsGuestUserId,
      toUserId: creatorProfile.ntzsUserId,
      amountTzs: creatorEarning,
    });

    // Update purchase status
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
    await db
      .update(guestPurchases)
      .set({
        status: "paid",
        transferId: transfer.id,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(guestPurchases.id, purchaseId));

    // Increment purchase count on the link
    await db
      .update(viewOnceLinks)
      .set({
        purchaseCount: sql`${viewOnceLinks.purchaseCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(viewOnceLinks.id, link.id));

    // Credit creator's internal ledger
    // Use a synthetic payment intent ID for tracking
    const syntheticPaymentIntentId = `guest_${purchaseId}`;
    await creditCreatorWallet({
      creatorId: link.creatorId,
      amountTzs: purchase.amountTzs,
      paymentIntentId: syntheticPaymentIntentId,
      contentTitle: link.content?.title || "View-once purchase",
    });

    return { success: true, transferId: transfer.id };
  } catch (err) {
    const msg = err instanceof NtzsApiError ? err.message : String(err);
    console.error("[guest-payment] Transfer failed:", msg);
    return { success: false, error: msg };
  }
}
