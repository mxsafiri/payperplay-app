import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents, entitlements, content, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getNtzsClient, NtzsApiError } from "@/lib/ntzs";
import { ensureNtzsWallet } from "@/lib/ntzs-provision";
import { creditCreatorWallet } from "@/lib/wallet";
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

    const { contentId } = await req.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
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

    // Ensure fan has an nTZS wallet (lazy-provision if needed)
    const ntzsUserId = await ensureNtzsWallet(profile.id);
    if (!ntzsUserId) {
      return NextResponse.json(
        { error: "Wallet not available. Please try again." },
        { status: 400 }
      );
    }

    // Check fan has sufficient nTZS balance
    const ntzs = getNtzsClient();
    const { balanceTzs } = await ntzs.users.getBalance(ntzsUserId);
    if (balanceTzs < contentItem.priceTzs) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: contentItem.priceTzs,
          balance: balanceTzs,
          topUpRequired: contentItem.priceTzs - balanceTzs,
        },
        { status: 402 }
      );
    }

    // Get platform nTZS user ID (creator of the content gets 85%, platform holds remainder)
    const creatorProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, contentItem.creatorId),
    });

    // Ensure creator has a wallet too
    const creatorNtzsUserId = creatorProfile?.ntzsUserId ||
      await ensureNtzsWallet(contentItem.creatorId);

    // Execute nTZS transfer: fan → creator (85% of price)
    const platformFee = Math.round(contentItem.priceTzs * 0.15);
    const creatorEarning = contentItem.priceTzs - platformFee;

    let transferResult;
    if (creatorNtzsUserId) {
      try {
        transferResult = await ntzs.transfers.create({
          fromUserId: ntzsUserId,
          toUserId: creatorNtzsUserId,
          amountTzs: creatorEarning,
        });
      } catch (transferErr) {
        const msg = transferErr instanceof NtzsApiError ? transferErr.message : String(transferErr);
        console.error("nTZS transfer error:", msg);

        if (msg.includes("insufficient funds") || msg.includes("gas") || msg.includes("INSUFFICIENT_FUNDS")) {
          return NextResponse.json(
            { error: "Payment system is temporarily unavailable. Our team has been notified — please try again in a few minutes." },
            { status: 503 }
          );
        }
        if (msg.includes("settlement on hold")) {
          return NextResponse.json(
            { error: "Your wallet is temporarily restricted. Please contact support@payperplay.xyz to resolve this." },
            { status: 403 }
          );
        }
        if (msg.includes("Insufficient balance")) {
          return NextResponse.json(
            { error: "Insufficient wallet balance", required: contentItem.priceTzs, balance: balanceTzs, topUpRequired: contentItem.priceTzs - balanceTzs },
            { status: 402 }
          );
        }
        return NextResponse.json({ error: `Payment failed: ${msg}` }, { status: 500 });
      }
    } else {
      // Creator not on nTZS yet — record locally
      transferResult = { id: `local_${Date.now()}`, status: "completed", amountTzs: creatorEarning };
    }

    // Record payment intent as paid
    const [paymentIntent] = await db
      .insert(paymentIntents)
      .values({
        userId: profile.id,
        contentId,
        amountTzs: contentItem.priceTzs,
        status: "paid",
        phoneNumber: "ntzs_wallet",
        provider: "ntzs",
        providerReference: transferResult.id,
        paidAt: new Date(),
      })
      .returning();

    // Grant entitlement immediately (transfer is synchronous)
    await db.insert(entitlements).values({
      userId: profile.id,
      contentId,
      paymentIntentId: paymentIntent.id,
    });

    // Credit creator internal ledger
    await creditCreatorWallet({
      creatorId: contentItem.creatorId,
      amountTzs: contentItem.priceTzs,
      paymentIntentId: paymentIntent.id,
      contentTitle: contentItem.title,
    }).catch((err) => console.error("Internal ledger credit error:", err));

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      transferId: transferResult.id,
      amount: contentItem.priceTzs,
      message: "Payment successful — content unlocked",
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    const message = error instanceof NtzsApiError
      ? `Payment failed: ${error.message}`
      : "Failed to initiate payment";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
