import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents, content } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { paymentProvider } from "@/lib/payments";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
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

    const { contentId, phoneNumber } = await req.json();

    if (!contentId || !phoneNumber) {
      return NextResponse.json(
        { error: "Content ID and phone number are required" },
        { status: 400 }
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

    // Get content details
    const contentItem = await db.query.content.findFirst({
      where: eq(content.id, contentId),
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (contentItem.status !== "published") {
      return NextResponse.json(
        { error: "Content is not available" },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingEntitlement = await db.query.entitlements.findFirst({
      where: (entitlements, { and, eq }) =>
        and(
          eq(entitlements.userId, profile.id),
          eq(entitlements.contentId, contentId)
        ),
    });

    if (existingEntitlement) {
      return NextResponse.json(
        { error: "You already have access to this content" },
        { status: 400 }
      );
    }

    // Create payment intent
    const [paymentIntent] = await db
      .insert(paymentIntents)
      .values({
        userId: profile.id,
        contentId,
        amountTzs: contentItem.priceTzs,
        status: "pending",
        phoneNumber,
        provider: paymentProvider.name,
      })
      .returning();

    // Initiate payment with provider
    const paymentResult = await paymentProvider.initiate({
      amount: contentItem.priceTzs,
      currency: "TZS",
      phoneNumber,
      reference: paymentIntent.id,
    });

    if (!paymentResult.success) {
      // Update payment intent as failed
      await db
        .update(paymentIntents)
        .set({ status: "failed" })
        .where(eq(paymentIntents.id, paymentIntent.id));

      return NextResponse.json(
        { error: paymentResult.error || "Payment initiation failed" },
        { status: 400 }
      );
    }

    // Update payment intent with provider reference
    await db
      .update(paymentIntents)
      .set({ providerReference: paymentResult.providerReference })
      .where(eq(paymentIntents.id, paymentIntent.id));

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      providerReference: paymentResult.providerReference,
      instructions: paymentResult.instructions,
      amount: contentItem.priceTzs,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
