"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Film, CreditCard, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "Content", icon: Film },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 shrink-0 border-r border-white/8 bg-neutral-950 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-mono text-amber-500/80 tracking-widest uppercase">PPP.ADMIN</span>
        </div>
        <p className="text-[9px] font-mono text-neutral-600 mt-1 tracking-wider">CONTROL PANEL</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-mono transition-colors ${
                active
                  ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500"
                  : "text-neutral-500 hover:text-white hover:bg-white/4 border-l-2 border-transparent"
              }`}
            >
              <Icon size={13} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
