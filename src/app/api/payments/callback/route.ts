import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entitlements, paymentIntents, platformSubscriptions } from "@/db/schema";
import { activateWeeklySubscription } from "@/lib/subscription";
import { eq, and } from "drizzle-orm";
import { verifyNtzsWebhook } from "@/lib/webhook-verify";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // ── Signature verification ────────────────────────────────────────────────
    const signature = req.headers.get("x-ntzs-signature");
    if (!verifyNtzsWebhook(rawBody, signature)) {
      console.warn("[payments/callback] Rejected — invalid webhook signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type as string;
    const data = payload.data as {
      id: string;
      userId?: string;
      status?: string;
      amountTzs?: number;
      metadata?: { reference?: string; contentId?: string; fanProfileId?: string; type?: string };
    };

    console.log("[payments/callback] Event received:", eventType);

    // ── deposit.completed — fan topped up, may trigger subscription ──────────
    if (eventType === "deposit.completed" && data.metadata?.reference?.startsWith("sub_")) {
      const parts = data.metadata.reference.split("_");
      const profileId = parts[1];
      if (profileId) {
        // Idempotency: only activate if not already tied to this reference
        const existing = await db.query.platformSubscriptions.findFirst({
          where: and(
            eq(platformSubscriptions.profileId, profileId),
            eq(platformSubscriptions.paymentIntentId, data.metadata.reference)
          ),
        });
        if (!existing) {
          await activateWeeklySubscription(profileId, data.metadata.reference);
          console.log("[payments/callback] Subscription activated for profile:", profileId);
        } else {
          console.log("[payments/callback] Duplicate deposit event, subscription already active:", profileId);
        }
      }
      return NextResponse.json({ success: true });
    }

    // ── transfer.completed — safety net for content purchase ─────────────────
    // Primary flow grants entitlement synchronously in /api/payments/initiate.
    // This catches any edge cases where that failed.
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
            console.log("[payments/callback] Entitlement granted via transfer webhook:", { fanProfileId, contentId });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[payments/callback] Error:", error);
    return NextResponse.json({ error: "Failed to process callback" }, { status: 500 });
  }
}
