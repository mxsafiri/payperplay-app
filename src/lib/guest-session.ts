/**
 * Guest session management for view-once link purchases.
 * Guests get a httpOnly cookie that grants temporary access to paid content.
 */
import { cookies } from "next/headers";
import { db } from "@/db";
import { guestPurchases } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

const GUEST_COOKIE_NAME = "pp_guest_session";
const SESSION_DURATION_HOURS = 4;

/**
 * Create a guest purchase record and set the session cookie.
 */
export async function createGuestSession(params: {
  viewOnceLinkId: string;
  phoneNumber: string;
  deviceFingerprint: string;
  amountTzs: number;
  ipAddress?: string;
}): Promise<{ sessionToken: string; purchaseId: string }> {
  const sessionToken = crypto.randomUUID();

  const [purchase] = await db
    .insert(guestPurchases)
    .values({
      viewOnceLinkId: params.viewOnceLinkId,
      phoneNumber: params.phoneNumber,
      deviceFingerprint: params.deviceFingerprint,
      sessionToken,
      ipAddress: params.ipAddress || null,
      amountTzs: params.amountTzs,
      status: "pending",
    })
    .returning();

  return { sessionToken, purchaseId: purchase.id };
}

/**
 * Activate a guest session after payment is confirmed.
 * Sets the httpOnly cookie and updates expiry.
 */
export async function activateGuestSession(purchaseId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await db
    .update(guestPurchases)
    .set({
      status: "paid",
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(guestPurchases.id, purchaseId));

  // Set httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE_NAME, purchaseId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
}

/**
 * Get a valid guest session from the cookie, if one exists for the given link.
 */
export async function getGuestSession(
  viewOnceLinkId: string
): Promise<typeof guestPurchases.$inferSelect | null> {
  const cookieStore = await cookies();
  const purchaseId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (!purchaseId) return null;

  const purchase = await db.query.guestPurchases.findFirst({
    where: and(
      eq(guestPurchases.id, purchaseId),
      eq(guestPurchases.viewOnceLinkId, viewOnceLinkId),
      eq(guestPurchases.status, "paid"),
      gt(guestPurchases.expiresAt, new Date())
    ),
  });

  return purchase ?? null;
}

/**
 * Get any valid guest session from the cookie (regardless of link).
 */
export async function getAnyGuestSession(): Promise<typeof guestPurchases.$inferSelect | null> {
  const cookieStore = await cookies();
  const purchaseId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  if (!purchaseId) return null;

  const purchase = await db.query.guestPurchases.findFirst({
    where: and(
      eq(guestPurchases.id, purchaseId),
      eq(guestPurchases.status, "paid"),
      gt(guestPurchases.expiresAt, new Date())
    ),
  });

  return purchase ?? null;
}

/**
 * Mark a guest purchase as watched.
 */
export async function markGuestWatched(purchaseId: string): Promise<void> {
  await db
    .update(guestPurchases)
    .set({ watched: true, updatedAt: new Date() })
    .where(eq(guestPurchases.id, purchaseId));
}
