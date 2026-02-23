import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { getSubscriptionStatus, WEEKLY_PRICE_TZS } from "@/lib/subscription";

export async function GET() {
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

    // Creators always have access — they don't need a subscription
    if (profile.role === "creator") {
      return NextResponse.json({
        hasAccess: true,
        status: "creator",
        expiresAt: null,
        graceEndsAt: null,
        trialUsed: false,
        daysRemaining: 999,
        isGracePeriod: false,
        isCreator: true,
        weeklyPrice: WEEKLY_PRICE_TZS,
      });
    }

    const sub = await getSubscriptionStatus(profile.id);

    return NextResponse.json({
      ...sub,
      isCreator: false,
      weeklyPrice: WEEKLY_PRICE_TZS,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}
