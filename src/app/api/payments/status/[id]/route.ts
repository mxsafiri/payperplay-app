import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get payment intent
    let paymentIntent = await db.query.paymentIntents.findFirst({
      where: eq(paymentIntents.id, id),
    });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (paymentIntent.userId !== profile.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // nTZS transfers are immediate — status is set synchronously in /api/payments/initiate.
    // No provider polling needed.

    // Check if entitlement exists
    const hasEntitlement = paymentIntent!.status === "paid"
      ? !!(await db.query.entitlements.findFirst({
          where: (ent, { and, eq }) =>
            and(
              eq(ent.userId, paymentIntent!.userId),
              eq(ent.contentId, paymentIntent!.contentId)
            ),
        }))
      : false;

    return NextResponse.json({
      id: paymentIntent!.id,
      status: paymentIntent!.status,
      amount: paymentIntent!.amountTzs,
      paidAt: paymentIntent!.paidAt,
      hasEntitlement,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
