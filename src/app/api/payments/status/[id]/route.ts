import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents } from "@/db/schema";
import { paymentProvider } from "@/lib/payments";
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

    // If still pending, check provider for failures only.
    // Entitlements are ONLY granted by the webhook callback — never by polling.
    // Snippe's checkStatus returns "completed" even before the user confirms
    // payment on their phone, so we cannot trust it for granting access.
    if (paymentIntent.status === "pending" && paymentIntent.providerReference) {
      try {
        const providerStatus = await paymentProvider.checkStatus(paymentIntent.providerReference);

        console.log("Polling status for", paymentIntent.id, "→", providerStatus.status);

        if (providerStatus.status === "failed") {
          await db
            .update(paymentIntents)
            .set({ status: "failed" })
            .where(eq(paymentIntents.id, paymentIntent.id));

          paymentIntent = await db.query.paymentIntents.findFirst({
            where: eq(paymentIntents.id, id),
          });
        }
        // Do NOT grant entitlements here — only the webhook callback can do that
      } catch (pollError) {
        console.error("Provider status poll error:", pollError);
      }
    }

    // Check if entitlement exists (webhook may have granted it)
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
