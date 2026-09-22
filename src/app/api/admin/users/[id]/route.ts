import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, authUser, content, paymentIntents, entitlements, creatorWallets, walletTransactions, platformSubscriptions } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const profile = await db
    .select({
      id: profiles.id,
      handle: profiles.handle,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      role: profiles.role,
      isSuspended: profiles.isSuspended,
      ntzsUserId: profiles.ntzsUserId,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
    })
    .from(profiles)
    .innerJoin(authUser, eq(authUser.id, profiles.userId))
    .where(eq(profiles.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [recentPayments, recentContent, wallet, sub, [{ total: entitlementCount }]] = await Promise.all([
    db.select().from(paymentIntents).where(eq(paymentIntents.userId, id))
      .orderBy(desc(paymentIntents.createdAt)).limit(10),
    db.select({ id: content.id, title: content.title, status: content.status, priceTzs: content.priceTzs, viewCount: content.viewCount, createdAt: content.createdAt })
      .from(content).where(eq(content.creatorId, id)).orderBy(desc(content.createdAt)).limit(10),
    db.query.creatorWallets.findFirst({ where: eq(creatorWallets.creatorId, id) }),
    db.query.platformSubscriptions.findFirst({ where: eq(platformSubscriptions.profileId, id) }),
    db.select({ total: count() }).from(entitlements).where(eq(entitlements.userId, id)),
  ]);

  return NextResponse.json({ profile, recentPayments, recentContent, wallet, sub, entitlementCount });
}
