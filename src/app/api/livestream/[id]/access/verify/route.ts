import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { livestreamAccess, livestreams, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getNtzsClient } from "@/lib/ntzs";

/**
 * GET /api/livestream/[id]/access/verify?accessId=xxx — Poll payment status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accessId = req.nextUrl.searchParams.get("accessId");

  if (!accessId) {
    return NextResponse.json({ error: "accessId required" }, { status: 400 });
  }

  const access = await db.query.livestreamAccess.findFirst({
    where: and(
      eq(livestreamAccess.id, accessId),
      eq(livestreamAccess.livestreamId, id)
    ),
  });

  if (!access) {
    return NextResponse.json({ error: "Access record not found" }, { status: 404 });
  }

  // Already paid
  if (access.status === "paid") {
    return NextResponse.json({ status: "paid", hasAccess: true });
  }

  if (access.status === "expired") {
    return NextResponse.json({ status: "expired" });
  }

  // Check deposit status on nTZS
  if (!access.depositId) {
    return NextResponse.json({ status: "pending" });
  }

  const ntzs = getNtzsClient();

  try {
    const deposit = await ntzs.deposits.get(access.depositId);

    if (deposit.status === "completed" || deposit.status === "success" || deposit.status === "minted") {
      // Payment received — transfer to creator
      const stream = await db.query.livestreams.findFirst({
        where: eq(livestreams.id, id),
        columns: { creatorId: true },
      });

      if (stream) {
        const creatorProfile = await db.query.profiles.findFirst({
          where: eq(profiles.id, stream.creatorId),
          columns: { ntzsUserId: true },
        });

        if (creatorProfile?.ntzsUserId && access.ntzsGuestUserId) {
          try {
            const transfer = await ntzs.transfers.create({
              fromUserId: access.ntzsGuestUserId,
              toUserId: creatorProfile.ntzsUserId,
              amountTzs: access.amountTzs,
              metadata: { livestreamId: id, accessId },
            });

            await db.update(livestreamAccess)
              .set({
                status: "paid",
                transferId: transfer.id,
                updatedAt: new Date(),
              })
              .where(eq(livestreamAccess.id, accessId));

            return NextResponse.json({ status: "paid", hasAccess: true });
          } catch (err) {
            console.error("[LivestreamAccess] Transfer failed:", err);
            // Mark as paid anyway — money is in the system
            await db.update(livestreamAccess)
              .set({ status: "paid", updatedAt: new Date() })
              .where(eq(livestreamAccess.id, accessId));

            return NextResponse.json({ status: "paid", hasAccess: true });
          }
        }
      }

      // No creator wallet — still mark as paid
      await db.update(livestreamAccess)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(livestreamAccess.id, accessId));

      return NextResponse.json({ status: "paid", hasAccess: true });
    }

    if (deposit.status === "failed" || deposit.status === "cancelled") {
      await db.update(livestreamAccess)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(livestreamAccess.id, accessId));

      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "pending" });
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
