import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, content, paymentIntents, platformSubscriptions, creatorWallets } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { count, eq, sum, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    [{ total: totalUsers }],
    [{ total: totalCreators }],
    [{ total: totalContent }],
    [{ total: publishedContent }],
    [{ total: totalPayments }],
    [{ total: recentPayments }],
    [{ total: activeSubs }],
    revenueRow,
  ] = await Promise.all([
    db.select({ total: count() }).from(profiles),
    db.select({ total: count() }).from(profiles).where(eq(profiles.role, "creator")),
    db.select({ total: count() }).from(content),
    db.select({ total: count() }).from(content).where(eq(content.status, "published")),
    db.select({ total: count() }).from(paymentIntents).where(eq(paymentIntents.status, "paid")),
    db.select({ total: count() }).from(paymentIntents)
      .where(eq(paymentIntents.status, "paid")),
    db.select({ total: count() }).from(platformSubscriptions)
      .where(eq(platformSubscriptions.status, "active")),
    db.select({ total: sum(creatorWallets.totalEarned) }).from(creatorWallets),
  ]);

  return NextResponse.json({
    totalUsers,
    totalCreators,
    totalFans: totalUsers - totalCreators,
    totalContent,
    publishedContent,
    totalPayments,
    recentPayments,
    activeSubs,
    totalRevenueTzs: Number(revenueRow[0]?.total ?? 0),
  });
}
