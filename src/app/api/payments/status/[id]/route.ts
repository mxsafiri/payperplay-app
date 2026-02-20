import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents, entitlements, content } from "@/db/schema";
import { paymentProvider } from "@/lib/payments";
import { creditCreatorWallet } from "@/lib/wallet";
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

    // If still pending, actively check the provider for the real status
    if (paymentIntent.status === "pending" && paymentIntent.providerReference) {
      try {
        const providerStatus = await paymentProvider.checkStatus(paymentIntent.providerReference);

        if (providerStatus.status === "paid" || providerStatus.status === "failed") {
          // Update our DB with the real status
          await db
            .update(paymentIntents)
            .set({
              status: providerStatus.status,
              paidAt: providerStatus.status === "paid" ? (providerStatus.paidAt || new Date()) : null,
            })
            .where(eq(paymentIntents.id, paymentIntent.id));

          // If paid, grant entitlement + credit creator wallet
          if (providerStatus.status === "paid") {
            const existingEntitlement = await db.query.entitlements.findFirst({
              where: (ent, { and, eq }) =>
                and(
                  eq(ent.userId, paymentIntent!.userId),
                  eq(ent.contentId, paymentIntent!.contentId)
                ),
            });

            if (!existingEntitlement) {
              await db.insert(entitlements).values({
                userId: paymentIntent.userId,
                contentId: paymentIntent.contentId,
                paymentIntentId: paymentIntent.id,
              });

              const contentItem = await db.query.content.findFirst({
                where: eq(content.id, paymentIntent.contentId),
              });

              if (contentItem) {
                await creditCreatorWallet({
                  creatorId: contentItem.creatorId,
                  amountTzs: paymentIntent.amountTzs,
                  paymentIntentId: paymentIntent.id,
                  contentTitle: contentItem.title,
                });
              }

              console.log("Payment confirmed via polling:", {
                paymentIntentId: paymentIntent.id,
                userId: paymentIntent.userId,
                contentId: paymentIntent.contentId,
              });
            }
          }

          // Re-read the updated payment intent
          paymentIntent = await db.query.paymentIntents.findFirst({
            where: eq(paymentIntents.id, id),
          });
        }
      } catch (pollError) {
        console.error("Provider status poll error:", pollError);
      }
    }

    return NextResponse.json({
      id: paymentIntent!.id,
      status: paymentIntent!.status,
      amount: paymentIntent!.amountTzs,
      paidAt: paymentIntent!.paidAt,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
