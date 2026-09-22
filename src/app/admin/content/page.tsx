"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Archive } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  status: string;
  priceTzs: number;
  viewCount: number;
  createdAt: string;
  handle: string;
  displayName: string | null;
}

type Toast = { type: "ok" | "err"; msg: string };

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/content?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.content);
    }
    setLoading(false);
  }, [q, status, page]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleArchive = async (id: string) => {
    setArchiving(id);
    try {
      const res = await fetch(`/api/admin/content/${id}/archive`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setToast({ type: "ok", msg: json.message ?? "Archived." });
        fetchContent();
      } else {
        setToast({ type: "err", msg: json.error ?? "Failed to archive." });
      }
    } catch {
      setToast({ type: "err", msg: "Network error." });
    } finally {
      setArchiving(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const statusColor = (s: string) => {
    if (s === "published") return "bg-green-500/10 text-green-400";
    if (s === "archived") return "bg-red-500/10 text-red-400";
    return "bg-neutral-800 text-neutral-500";
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 text-sm font-mono border ${toast.type === "ok" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-white font-mono font-bold text-xl">Content</h1>
        <p className="text-neutral-500 font-mono text-xs mt-1">Moderate and manage all creator content.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search title…"
            className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-neutral-900 border border-white/10 text-white font-mono text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-white/8 bg-neutral-900">
        <div className="grid grid-cols-[2fr_1fr_70px_70px_80px_70px] gap-0 border-b border-white/8">
          {["Title", "Creator", "Status", "Price", "Views", ""].map((h) => (
            <div key={h} className="px-4 py-2.5 text-[10px] font-mono text-neutral-500 tracking-widest uppercase">{h}</div>
          ))}
        </div>

        {loading && (
          <div className="px-4 py-10 text-center">
            <span className="text-xs font-mono text-neutral-600">Loading…</span>
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="px-4 py-10 text-center">
            <span className="text-xs font-mono text-neutral-600">No content found</span>
          </div>
        )}
        {!loading && items.map((c) => (
          <div key={c.id} className="grid grid-cols-[2fr_1fr_70px_70px_80px_70px] gap-0 border-b border-white/5 items-center">
            <div className="px-4 py-3">
              <p className="text-sm font-mono text-white truncate">{c.title}</p>
              <p className="text-[10px] font-mono text-neutral-600">{new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-mono text-neutral-400">@{c.handle}</p>
              {c.displayName && <p className="text-[10px] font-mono text-neutral-600 truncate">{c.displayName}</p>}
            </div>
            <div className="px-4 py-3">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 ${statusColor(c.status)}`}>{c.status.toUpperCase()}</span>
            </div>
            <div className="px-4 py-3">
              <span className="text-xs font-mono text-neutral-400">{c.priceTzs.toLocaleString()}</span>
            </div>
            <div className="px-4 py-3">
              <span className="text-xs font-mono text-neutral-400">{c.viewCount.toLocaleString()}</span>
            </div>
            <div className="px-4 py-3 flex justify-end">
              {c.status !== "archived" && (
                <button
                  onClick={() => handleArchive(c.id)}
                  disabled={archiving === c.id}
                  title="Archive"
                  className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <Archive size={13} />
                </button>
              )}
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
        <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 25}
          className="px-3 py-1.5 text-xs font-mono border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}
