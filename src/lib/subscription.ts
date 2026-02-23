import { db } from "@/db";
import { platformSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Constants
export const WEEKLY_PRICE_TZS = 500;
export const TRIAL_DURATION_DAYS = 30;
export const SUBSCRIPTION_DURATION_DAYS = 7;
export const GRACE_PERIOD_DAYS = 2;

export type SubscriptionStatus = {
  hasAccess: boolean;
  status: "trial" | "active" | "grace" | "expired" | "none";
  expiresAt: Date | null;
  graceEndsAt: Date | null;
  trialUsed: boolean;
  daysRemaining: number;
  isGracePeriod: boolean;
};

/**
 * Check a user's current subscription status.
 * Returns computed status including grace period logic.
 */
export async function getSubscriptionStatus(profileId: string): Promise<SubscriptionStatus> {
  const sub = await db.query.platformSubscriptions.findFirst({
    where: eq(platformSubscriptions.profileId, profileId),
  });

  if (!sub) {
    return {
      hasAccess: false,
      status: "none",
      expiresAt: null,
      graceEndsAt: null,
      trialUsed: false,
      daysRemaining: 0,
      isGracePeriod: false,
    };
  }

  const now = new Date();
  const expiresAt = new Date(sub.expiresAt);
  const graceEndsAt = sub.graceEndsAt ? new Date(sub.graceEndsAt) : null;

  // Active or trial — not yet expired
  if (now < expiresAt) {
    const msRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    return {
      hasAccess: true,
      status: sub.status === "trial" ? "trial" : "active",
      expiresAt,
      graceEndsAt,
      trialUsed: sub.trialUsed,
      daysRemaining,
      isGracePeriod: false,
    };
  }

  // In grace period
  if (graceEndsAt && now < graceEndsAt) {
    const msRemaining = graceEndsAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    return {
      hasAccess: true,
      status: "grace",
      expiresAt,
      graceEndsAt,
      trialUsed: sub.trialUsed,
      daysRemaining,
      isGracePeriod: true,
    };
  }

  // Expired
  return {
    hasAccess: false,
    status: "expired",
    expiresAt,
    graceEndsAt,
    trialUsed: sub.trialUsed,
    daysRemaining: 0,
    isGracePeriod: false,
  };
}

/**
 * Activate the 30-day free trial for a user.
 */
export async function activateTrial(profileId: string) {
  // Check if trial already used
  const existing = await db.query.platformSubscriptions.findFirst({
    where: eq(platformSubscriptions.profileId, profileId),
  });

  if (existing?.trialUsed) {
    return { success: false, error: "Free trial already used" };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const graceEndsAt = new Date(expiresAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  if (existing) {
    // Update existing record
    const [updated] = await db
      .update(platformSubscriptions)
      .set({
        status: "trial",
        startsAt: now,
        expiresAt,
        graceEndsAt,
        trialUsed: true,
        updatedAt: now,
      })
      .where(eq(platformSubscriptions.id, existing.id))
      .returning();
    return { success: true, subscription: updated };
  }

  // Create new subscription
  const [sub] = await db
    .insert(platformSubscriptions)
    .values({
      profileId,
      status: "trial",
      startsAt: now,
      expiresAt,
      graceEndsAt,
      trialUsed: true,
    })
    .returning();

  return { success: true, subscription: sub };
}

/**
 * Activate or renew a weekly subscription after payment.
 */
export async function activateWeeklySubscription(profileId: string, paymentRef?: string) {
  const existing = await db.query.platformSubscriptions.findFirst({
    where: eq(platformSubscriptions.profileId, profileId),
  });

  const now = new Date();
  // If currently active, extend from current expiry; otherwise start from now
  const startFrom = existing && new Date(existing.expiresAt) > now
    ? new Date(existing.expiresAt)
    : now;
  const expiresAt = new Date(startFrom.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const graceEndsAt = new Date(expiresAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  if (existing) {
    const [updated] = await db
      .update(platformSubscriptions)
      .set({
        status: "active",
        startsAt: startFrom,
        expiresAt,
        graceEndsAt,
        paymentIntentId: paymentRef || existing.paymentIntentId,
        updatedAt: now,
      })
      .where(eq(platformSubscriptions.id, existing.id))
      .returning();
    return { success: true, subscription: updated };
  }

  const [sub] = await db
    .insert(platformSubscriptions)
    .values({
      profileId,
      status: "active",
      startsAt: startFrom,
      expiresAt,
      graceEndsAt,
      trialUsed: false,
      paymentIntentId: paymentRef,
    })
    .returning();

  return { success: true, subscription: sub };
}
