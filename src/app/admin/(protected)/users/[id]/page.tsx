"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Shield, ShieldOff, UserCog, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface UserDetail {
  profile: {
    id: string; handle: string; displayName: string | null; bio: string | null;
    avatarUrl: string | null; role: string; isSuspended: boolean;
    ntzsUserId: string | null; createdAt: string; email: string; emailVerified: boolean;
  };
  wallet: { balance: number; totalEarned: number; totalWithdrawn: number } | null;
  sub: { status: string; expiresAt: string | null } | null;
  entitlementCount: number;
  recentPayments: { id: string; amountTzs: number; status: string; createdAt: string }[];
  recentContent: { id: string; title: string; status: string; priceTzs: number; viewCount: number; createdAt: string }[];
}

type Toast = { type: "ok" | "err"; msg: string };

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${id}`);
    if (res.ok) setData(await res.json());
    else router.push("/admin/users");
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const runAction = async (key: string, url: string, opts: RequestInit) => {
    setActionLoading(key);
    try {
      const res = await fetch(url, opts);
      const json = await res.json();
      if (res.ok) {
        showToast("ok", json.message ?? "Done.");
        fetchUser();
      } else {
        showToast("err", json.error ?? "Something went wrong.");
      }
    } catch {
      showToast("err", "Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = () => runAction("suspend",
    `/api/admin/users/${id}/suspend`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend: !data?.profile.isSuspended }) });

  const handleResetPassword = () => runAction("reset",
    `/api/admin/users/${id}/reset-password`,
    { method: "POST" });

  const handleRoleChange = (role: string) => runAction("role",
    `/api/admin/users/${id}/role`,
    { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }) });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-xs font-mono text-neutral-600">Loading…</span>
    </div>
  );
  if (!data) return null;

  const { profile, wallet, sub, entitlementCount, recentPayments, recentContent } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 text-sm font-mono border ${toast.type === "ok" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {toast.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-white transition-colors">
        <ArrowLeft size={12} /> Back to users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-white font-mono font-bold text-xl">@{profile.handle}</h1>
            <span className={`text-[10px] font-mono px-2 py-0.5 ${profile.role === "creator" ? "bg-amber-500/10 text-amber-400" : "bg-neutral-800 text-neutral-500"}`}>
              {profile.role.toUpperCase()}
            </span>
            {profile.isSuspended && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400">SUSPENDED</span>
            )}
          </div>
          <p className="text-neutral-500 font-mono text-xs">{profile.email}</p>
          {profile.displayName && <p className="text-neutral-400 font-mono text-xs mt-0.5">{profile.displayName}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="border border-white/8 bg-neutral-900 p-4">
        <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-4">Actions</p>
        <div className="flex flex-wrap gap-3">
          {/* Suspend / Unsuspend */}
          <button
            onClick={handleSuspend}
            disabled={actionLoading === "suspend"}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono border transition-colors disabled:opacity-50 ${
              profile.isSuspended
                ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                : "border-red-500/30 text-red-400 hover:bg-red-500/10"
            }`}
          >
            {profile.isSuspended ? <Shield size={12} /> : <ShieldOff size={12} />}
            {actionLoading === "suspend" ? "…" : profile.isSuspended ? "Unsuspend" : "Suspend Account"}
          </button>

          {/* Reset Password */}
          <button
            onClick={handleResetPassword}
            disabled={actionLoading === "reset"}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
          >
            <Mail size={12} />
            {actionLoading === "reset" ? "Sending…" : "Send Password Reset"}
          </button>

          {/* Change Role */}
          {profile.role === "fan" ? (
            <button
              onClick={() => handleRoleChange("creator")}
              disabled={actionLoading === "role"}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-white/15 text-neutral-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
            >
              <UserCog size={12} />
              {actionLoading === "role" ? "…" : "Make Creator"}
            </button>
          ) : (
            <button
              onClick={() => handleRoleChange("fan")}
              disabled={actionLoading === "role"}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-white/15 text-neutral-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
            >
              <UserCog size={12} />
              {actionLoading === "role" ? "…" : "Switch to Fan"}
            </button>
          )}

          {/* Backfill nTZS wallet */}
          {!profile.ntzsUserId && (
            <button
              onClick={() => runAction("ntzs",
                "/api/admin/backfill-ntzs",
                { method: "POST", headers: { "Content-Type": "application/json" } }
              )}
              disabled={actionLoading === "ntzs"}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono border border-white/15 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} />
              Provision nTZS Wallet
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Wallet Balance", value: wallet ? `${wallet.balance.toLocaleString()} TZS` : "—" },
          { label: "Total Earned", value: wallet ? `${wallet.totalEarned.toLocaleString()} TZS` : "—" },
          { label: "Purchased Content", value: String(entitlementCount) },
          { label: "Subscription", value: sub ? sub.status.toUpperCase() : "NONE" },
        ].map((s) => (
          <div key={s.label} className="border border-white/8 bg-neutral-900 p-4">
            <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-1">{s.label}</p>
            <p className="text-base font-mono font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="border border-white/8 bg-neutral-900">
          <div className="px-4 py-3 border-b border-white/8">
            <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">Recent Payments</span>
          </div>
          <div className="divide-y divide-white/5">
            {recentPayments.length === 0 && <p className="px-4 py-6 text-xs font-mono text-neutral-600 text-center">None</p>}
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className={`text-[10px] font-mono ${p.status === "paid" ? "text-green-400" : "text-neutral-500"}`}>{p.status.toUpperCase()}</span>
                  <p className="text-[10px] font-mono text-neutral-600">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-mono text-white">{p.amountTzs.toLocaleString()} TZS</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content (creators only) */}
        {recentContent.length > 0 && (
          <div className="border border-white/8 bg-neutral-900">
            <div className="px-4 py-3 border-b border-white/8">
              <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">Content</span>
            </div>
            <div className="divide-y divide-white/5">
              {recentContent.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-mono text-white truncate max-w-[180px]">{c.title}</p>
                    <p className="text-[10px] font-mono text-neutral-600">{c.viewCount} views · {c.priceTzs} TZS</p>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 ${c.status === "published" ? "bg-green-500/10 text-green-400" : c.status === "archived" ? "bg-red-500/10 text-red-400" : "bg-neutral-800 text-neutral-500"}`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="border border-white/8 bg-neutral-900 p-4 text-[10px] font-mono text-neutral-600 space-y-1">
        <p>ID: {profile.id}</p>
        <p>nTZS: {profile.ntzsUserId ?? "not provisioned"}</p>
        <p>Email verified: {profile.emailVerified ? "yes" : "no"}</p>
        <p>Joined: {new Date(profile.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
