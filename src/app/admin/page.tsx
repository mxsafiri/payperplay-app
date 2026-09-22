import { db } from "@/db";
import { profiles, content, paymentIntents, platformSubscriptions, creatorWallets } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { count, eq, sum, desc } from "drizzle-orm";
import Link from "next/link";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtTzs(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M TZS`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K TZS`;
  return `${n} TZS`;
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [
    [{ total: totalUsers }],
    [{ total: totalCreators }],
    [{ total: totalContent }],
    [{ total: publishedContent }],
    [{ total: totalPayments }],
    [{ total: activeSubs }],
    revenueRow,
    recentPayments,
    recentUsers,
  ] = await Promise.all([
    db.select({ total: count() }).from(profiles),
    db.select({ total: count() }).from(profiles).where(eq(profiles.role, "creator")),
    db.select({ total: count() }).from(content),
    db.select({ total: count() }).from(content).where(eq(content.status, "published")),
    db.select({ total: count() }).from(paymentIntents).where(eq(paymentIntents.status, "paid")),
    db.select({ total: count() }).from(platformSubscriptions).where(eq(platformSubscriptions.status, "active")),
    db.select({ total: sum(creatorWallets.totalEarned) }).from(creatorWallets),
    db.select({
      id: paymentIntents.id,
      amountTzs: paymentIntents.amountTzs,
      status: paymentIntents.status,
      createdAt: paymentIntents.createdAt,
    }).from(paymentIntents).orderBy(desc(paymentIntents.createdAt)).limit(5),
    db.select({
      id: profiles.id,
      handle: profiles.handle,
      role: profiles.role,
      createdAt: profiles.createdAt,
    }).from(profiles).orderBy(desc(profiles.createdAt)).limit(5),
  ]);

  const totalRevenueTzs = Number(revenueRow[0]?.total ?? 0);

  const stats = [
    { label: "Total Users", value: fmt(totalUsers), sub: `${fmt(totalCreators)} creators` },
    { label: "Published Content", value: fmt(publishedContent), sub: `${fmt(totalContent)} total` },
    { label: "Paid Transactions", value: fmt(totalPayments), sub: "" },
    { label: "Active Subscriptions", value: fmt(activeSubs), sub: "" },
    { label: "Platform Revenue", value: fmtTzs(totalRevenueTzs), sub: "cumulative creator earnings" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white font-mono font-bold text-xl">Overview</h1>
        <p className="text-neutral-500 font-mono text-xs mt-1">Platform health at a glance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-white/8 bg-neutral-900 p-4">
            <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-2">{s.label}</p>
            <p className="text-2xl font-mono font-bold text-white">{s.value}</p>
            {s.sub && <p className="text-[10px] font-mono text-neutral-600 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="border border-white/8 bg-neutral-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">Recent Payments</span>
            <Link href="/admin/payments" className="text-[10px] font-mono text-amber-500/70 hover:text-amber-400">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentPayments.length === 0 && (
              <p className="px-4 py-6 text-xs font-mono text-neutral-600 text-center">No payments yet</p>
            )}
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 ${p.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                    {p.status.toUpperCase()}
                  </span>
                  <p className="text-[10px] font-mono text-neutral-600 mt-1">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-mono font-bold text-white">{p.amountTzs.toLocaleString()} TZS</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="border border-white/8 bg-neutral-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">Recent Users</span>
            <Link href="/admin/users" className="text-[10px] font-mono text-amber-500/70 hover:text-amber-400">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.length === 0 && (
              <p className="px-4 py-6 text-xs font-mono text-neutral-600 text-center">No users yet</p>
            )}
            {recentUsers.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors">
                <div>
                  <p className="text-sm font-mono text-white">@{u.handle}</p>
                  <p className="text-[10px] font-mono text-neutral-600">{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 ${u.role === "creator" ? "bg-amber-500/10 text-amber-400" : "bg-neutral-800 text-neutral-500"}`}>
                  {u.role.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
