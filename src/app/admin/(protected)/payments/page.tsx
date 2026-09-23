"use client";

import { useEffect, useState, useCallback } from "react";

interface Payment {
  id: string;
  amountTzs: number;
  status: string;
  createdAt: string;
  buyerHandle: string;
  contentTitle: string | null;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/payments?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPayments(data.payments);
    }
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-green-500/10 text-green-400";
    if (s === "failed") return "bg-red-500/10 text-red-400";
    if (s === "refunded") return "bg-blue-500/10 text-blue-400";
    return "bg-neutral-800 text-neutral-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-mono font-bold text-xl">Payments</h1>
        <p className="text-neutral-500 font-mono text-xs mt-1">View all payment intents across the platform.</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-neutral-900 border border-white/10 text-white font-mono text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-white/8 bg-neutral-900">
        <div className="grid grid-cols-[1fr_1fr_90px_90px_100px] gap-0 border-b border-white/8">
          {["Buyer", "Content", "Amount", "Status", "Date"].map((h) => (
            <div key={h} className="px-4 py-2.5 text-[10px] font-mono text-neutral-500 tracking-widest uppercase">{h}</div>
          ))}
        </div>

        {loading && (
          <div className="px-4 py-10 text-center">
            <span className="text-xs font-mono text-neutral-600">Loading…</span>
          </div>
        )}
        {!loading && payments.length === 0 && (
          <div className="px-4 py-10 text-center">
            <span className="text-xs font-mono text-neutral-600">No payments found</span>
          </div>
        )}
        {!loading && payments.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_1fr_90px_90px_100px] gap-0 border-b border-white/5 items-center">
            <div className="px-4 py-3">
              <p className="text-sm font-mono text-white">@{p.buyerHandle}</p>
              <p className="text-[10px] font-mono text-neutral-700 truncate">{p.id.slice(0, 12)}…</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-mono text-neutral-400 truncate">{p.contentTitle ?? "—"}</p>
            </div>
            <div className="px-4 py-3">
              <span className="text-sm font-mono font-bold text-white">{p.amountTzs.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-neutral-600 ml-1">TZS</span>
            </div>
            <div className="px-4 py-3">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 ${statusColor(p.status)}`}>{p.status.toUpperCase()}</span>
            </div>
            <div className="px-4 py-3">
              <span className="text-[10px] font-mono text-neutral-600">
                {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex gap-2 justify-end">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1.5 text-xs font-mono border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors">
          ← Prev
        </button>
        <span className="px-3 py-1.5 text-xs font-mono text-neutral-500">Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={payments.length < 25}
          className="px-3 py-1.5 text-xs font-mono border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}
