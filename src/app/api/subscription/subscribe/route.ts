import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { paymentProvider } from "@/lib/payments";
import { activateWeeklySubscription, WEEKLY_PRICE_TZS } from "@/lib/subscription";

export async function POST(req: NextRequest) {
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

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Generate a unique reference for this subscription payment
    const reference = `sub_${profile.id}_${Date.now()}`;

    // Initiate payment with provider
    const paymentResult = await paymentProvider.initiate({
      amount: WEEKLY_PRICE_TZS,
      currency: "TZS",
      phoneNumber,
      reference,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || "Payment initiation failed" },
        { status: 400 }
      );
    }

    // Mock provider: auto-confirm after short delay
    if (paymentProvider.name === "mock") {
      setTimeout(async () => {
        try {
          await activateWeeklySubscription(profile.id, reference);
          console.log("Mock subscription payment auto-confirmed for:", profile.id);
        } catch (err) {
          console.error("Mock subscription auto-confirm error:", err);
        }
      }, 2000);
    }

    return NextResponse.json({
      success: true,
      reference,
      providerReference: paymentResult.providerReference,
      instructions: paymentResult.instructions,
      amount: WEEKLY_PRICE_TZS,
    });
  } catch (error) {
    console.error("Subscription payment error:", error);
    return NextResponse.json({ error: "Failed to process subscription payment" }, { status: 500 });
  }
}
