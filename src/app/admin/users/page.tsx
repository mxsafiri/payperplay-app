"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, UserCheck, UserX } from "lucide-react";

interface User {
  id: string;
  handle: string;
  displayName: string | null;
  role: string;
  isSuspended: boolean;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }, [q, role, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-mono font-bold text-xl">Users</h1>
        <p className="text-neutral-500 font-mono text-xs mt-1">Search, view, and manage all accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search handle, name, email…"
            className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="bg-neutral-900 border border-white/10 text-white font-mono text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">All roles</option>
          <option value="creator">Creator</option>
          <option value="fan">Fan</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-white/8 bg-neutral-900">
        <div className="grid grid-cols-[1fr_1fr_80px_80px_80px] gap-0 border-b border-white/8">
          {["Handle", "Email", "Role", "Status", "Joined"].map((h) => (
            <div key={h} className="px-4 py-2.5 text-[10px] font-mono text-neutral-500 tracking-widest uppercase">{h}</div>
          ))}
        </div>

        {loading && (
          <div className="px-4 py-10 text-center">
            <span className="text-xs font-mono text-neutral-600">Loading…</span>
          </div>
        )}
        {!loading && users.length === 0 && (
          <div className="px-4 py-10 text-center">
            <span className="text-xs font-mono text-neutral-600">No users found</span>
          </div>
        )}
        {!loading && users.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="grid grid-cols-[1fr_1fr_80px_80px_80px] gap-0 border-b border-white/5 hover:bg-white/3 transition-colors"
          >
            <div className="px-4 py-3">
              <p className="text-sm font-mono text-white">@{u.handle}</p>
              {u.displayName && <p className="text-[10px] font-mono text-neutral-600">{u.displayName}</p>}
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-mono text-neutral-400 truncate">{u.email}</p>
              {!u.emailVerified && <span className="text-[9px] font-mono text-yellow-600">UNVERIFIED</span>}
            </div>
            <div className="px-4 py-3 flex items-center">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 ${u.role === "creator" ? "bg-amber-500/10 text-amber-400" : "bg-neutral-800 text-neutral-500"}`}>
                {u.role.toUpperCase()}
              </span>
            </div>
            <div className="px-4 py-3 flex items-center">
              {u.isSuspended
                ? <span className="flex items-center gap-1 text-[10px] font-mono text-red-400"><UserX size={10} />SUSP</span>
                : <span className="flex items-center gap-1 text-[10px] font-mono text-green-500"><UserCheck size={10} />OK</span>
              }
            </div>
            <div className="px-4 py-3 flex items-center">
              <span className="text-[10px] font-mono text-neutral-600">
                {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex gap-2 justify-end">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1.5 text-xs font-mono border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors">
          ← Prev
        </button>
        <span className="px-3 py-1.5 text-xs font-mono text-neutral-500">Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 25}
          className="px-3 py-1.5 text-xs font-mono border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}
