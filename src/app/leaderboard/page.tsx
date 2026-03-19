import type { Metadata } from "next";
import { eq, desc, sql } from "drizzle-orm";

import { db } from "@/db";
import { profiles, creatorWallets, content, follows } from "@/db/schema";
import { resolveAvatarUrl } from "@/lib/avatar";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import { dashboardNavLinks } from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Creator Leaderboard — PayPerPlay",
  description: "See Tanzania's top creators earning real money on PayPerPlay.",
};

export const revalidate = 300; // refresh every 5 minutes

export default async function LeaderboardPage() {
  type RisingRow = {
    id: string;
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
    this_month: number;
    last_month: number;
    growth_pct: number | null;
  };

  const [topEarners, topByViews, topByFollowers, risingRaw] = await Promise.all([
    // Top earners by wallet total_earned
    db
      .select({
        id: profiles.id,
        handle: profiles.handle,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        score: creatorWallets.totalEarned,
      })
      .from(creatorWallets)
      .innerJoin(profiles, eq(profiles.id, creatorWallets.creatorId))
      .orderBy(desc(creatorWallets.totalEarned))
      .limit(10),

    // Top by total content views
    db
      .select({
        id: profiles.id,
        handle: profiles.handle,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        score: sql<number>`cast(sum(${content.viewCount}) as int)`,
      })
      .from(content)
      .innerJoin(profiles, eq(profiles.id, content.creatorId))
      .where(eq(content.status, "published"))
      .groupBy(profiles.id, profiles.handle, profiles.displayName, profiles.avatarUrl)
      .orderBy(sql`sum(${content.viewCount}) desc`)
      .limit(10),

    // Top by follower count
    db
      .select({
        id: profiles.id,
        handle: profiles.handle,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        score: sql<number>`cast(count(${follows.id}) as int)`,
      })
      .from(follows)
      .innerJoin(profiles, eq(profiles.id, follows.creatorId))
      .groupBy(profiles.id, profiles.handle, profiles.displayName, profiles.avatarUrl)
      .orderBy(sql`count(${follows.id}) desc`)
      .limit(10),

    // Rising Star — biggest month-over-month earnings growth
    db.execute(sql`
      WITH monthly AS (
        SELECT
          cw.creator_id,
          SUM(CASE WHEN wt.created_at >= DATE_TRUNC('month', NOW())
                   THEN wt.amount ELSE 0 END)::int AS this_month,
          SUM(CASE WHEN wt.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
                    AND wt.created_at <  DATE_TRUNC('month', NOW())
                   THEN wt.amount ELSE 0 END)::int AS last_month
        FROM wallet_transactions wt
        JOIN creator_wallets cw ON cw.id = wt.wallet_id
        WHERE wt.type = 'earning' AND wt.status = 'completed'
        GROUP BY cw.creator_id
      )
      SELECT
        p.id::text,
        p.handle,
        p.display_name,
        p.avatar_url,
        m.this_month,
        m.last_month,
        CASE WHEN m.last_month > 0
          THEN ROUND((m.this_month - m.last_month)::numeric / m.last_month * 100, 1)
          ELSE NULL
        END AS growth_pct
      FROM monthly m
      JOIN profiles p ON p.id = m.creator_id
      WHERE m.this_month > 0
      ORDER BY growth_pct DESC NULLS LAST, m.this_month DESC
      LIMIT 10
    `),
  ]);

  // Resolve r2:// avatar URLs to presigned URLs
  async function resolveAvatars<T extends { avatarUrl: string | null }>(rows: T[]) {
    return Promise.all(
      rows.map(async (r) => ({ ...r, avatarUrl: await resolveAvatarUrl(r.avatarUrl) }))
    );
  }

  const risingRows: RisingRow[] = Array.isArray(risingRaw)
    ? (risingRaw as unknown as RisingRow[])
    : (((risingRaw as unknown as { rows: RisingRow[] }).rows) ?? []);

  const topRising = risingRows.map((r) => ({
    id: r.id,
    handle: r.handle,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    thisMonth: r.this_month,
    lastMonth: r.last_month,
    growthPct: r.growth_pct !== null ? Number(r.growth_pct) : null,
  }));

  const [resolvedEarners, resolvedViews, resolvedFollowers, resolvedRising] = await Promise.all([
    resolveAvatars(topEarners),
    resolveAvatars(topByViews),
    resolveAvatars(topByFollowers),
    resolveAvatars(topRising),
  ]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <DashboardNav links={dashboardNavLinks} />
      <LeaderboardClient
        topEarners={resolvedEarners}
        topByViews={resolvedViews}
        topByFollowers={resolvedFollowers}
        topRising={resolvedRising}
      />
      <DashboardFooter />
    </div>
  );
}
