import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { livestreams, livestreamAccess, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getNtzsClient } from "@/lib/ntzs";
import { headers } from "next/headers";

/**
 * GET /api/livestream/[id]/access — Check if user has access to a paid livestream
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ hasAccess: false });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile) {
    return NextResponse.json({ hasAccess: false });
  }

  // Check if user is the creator
  const stream = await db.query.livestreams.findFirst({
    where: eq(livestreams.id, id),
    columns: { creatorId: true, priceTzs: true },
  });

  if (!stream) {
    return NextResponse.json({ error: "Livestream not found" }, { status: 404 });
  }

  // Creator always has access
  if (stream.creatorId === profile.id) {
    return NextResponse.json({ hasAccess: true, isCreator: true });
  }

  // Free stream — everyone has access
  if (stream.priceTzs === 0) {
    return NextResponse.json({ hasAccess: true });
  }

  // Check for paid access
  const access = await db.query.livestreamAccess.findFirst({
    where: and(
      eq(livestreamAccess.livestreamId, id),
      eq(livestreamAccess.userId, profile.id),
      eq(livestreamAccess.status, "paid")
    ),
  });

  return NextResponse.json({ hasAccess: !!access });
}

/**
 * POST /api/livestream/[id]/access — Purchase access to a paid livestream via M-Pesa
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to purchase access" }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const stream = await db.query.livestreams.findFirst({
    where: eq(livestreams.id, id),
    columns: { id: true, priceTzs: true, creatorId: true },
  });

  if (!stream) {
    return NextResponse.json({ error: "Livestream not found" }, { status: 404 });
  }

  if (stream.priceTzs === 0) {
    return NextResponse.json({ hasAccess: true, message: "This is a free stream" });
  }

  // Check if already has access
  const existing = await db.query.livestreamAccess.findFirst({
    where: and(
      eq(livestreamAccess.livestreamId, id),
      eq(livestreamAccess.userId, profile.id),
      eq(livestreamAccess.status, "paid")
    ),
  });

  if (existing) {
    return NextResponse.json({ hasAccess: true, message: "Already purchased" });
  }

  const body = await req.json();
  const { phoneNumber } = body;

  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const ntzs = getNtzsClient();

  // Create or get guest nTZS user for the payment
  let ntzsUserId: string;
  const guestExternalId = `live-${profile.id}-${id}`;
  try {
    const user = await ntzs.users.create({
      externalId: guestExternalId,
      email: `live-${profile.id}@payperplay.xyz`,
      phone: phoneNumber,
    });
    ntzsUserId = user.id;
  } catch {
    // User might already exist
    try {
      const existing = await ntzs.users.get(guestExternalId);
      ntzsUserId = existing.id;
    } catch {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
    }
  }

  // Initiate M-Pesa deposit
  try {
    const deposit = await ntzs.deposits.create({
      userId: ntzsUserId,
      amountTzs: stream.priceTzs,
      phoneNumber,
    });

    // Create access record
    const [accessRecord] = await db.insert(livestreamAccess).values({
      livestreamId: id,
      userId: profile.id,
      phoneNumber,
      amountTzs: stream.priceTzs,
      status: "pending",
      depositId: deposit.id,
      ntzsGuestUserId: ntzsUserId,
    }).returning();

    return NextResponse.json({
      accessId: accessRecord.id,
      depositId: deposit.id,
      message: "M-Pesa prompt sent. Check your phone.",
    }, { status: 201 });
  } catch (err) {
    console.error("[LivestreamAccess] Deposit failed:", err);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
