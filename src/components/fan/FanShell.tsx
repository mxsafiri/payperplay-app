"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import {
  LayoutGrid,
  Library,
  User,
  Crown,
  LayoutDashboard,
  Wallet,
  Music,
} from "lucide-react";

type Profile = {
  role: "fan" | "creator";
};

const FAN_NAV_ITEMS = [
  { href: "/feed", label: "Discover", icon: LayoutGrid, id: "01" },
  { href: "/music", label: "Music", icon: Music, id: "02" },
  { href: "/library", label: "Library", icon: Library, id: "03" },
  { href: "/wallet", label: "Wallet", icon: Wallet, id: "04" },
  { href: "/profile", label: "Profile", icon: User, id: "05" },
  { href: "/subscribe", label: "Sub", icon: Crown, id: "06" },
];

export function FanShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetch("/api/profile/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.profile?.role) setProfile({ role: data.profile.role });
        })
        .catch(() => {});
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/20 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-2 border border-amber-500/40 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            <div className="absolute inset-4 bg-amber-500/20 animate-pulse" />
          </div>
          <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const mobileNavItems = profile?.role === "creator"
    ? [...FAN_NAV_ITEMS, { href: "/creator/dashboard", label: "Studio", icon: LayoutDashboard, id: "07" }]
    : FAN_NAV_ITEMS;

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950">
      {/* Tech grid background */}
      <div className="fixed inset-0 pointer-events-none tech-grid opacity-50" />
      {/* Amber blob top-right */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/4 blur-[120px] pointer-events-none" />
      {/* Pink blob bottom-left */}
      <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-pink-500/4 blur-[100px] pointer-events-none" />

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 z-40 flex-col border-r border-white/10 backdrop-blur-xl bg-neutral-950/90">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-black font-mono font-black text-sm">▶</span>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-amber-300/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">
                PayPerPlay
              </span>
            </div>
          </Link>
        </div>

        {/* System status */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 text-[9px] font-mono text-white/20">
            <span className="w-1 h-1 rounded-full bg-amber-500/60 animate-pulse" />
            <span className="tracking-widest uppercase">System Active</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5">
          {FAN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-xs font-mono transition-all ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500"
                    : "text-white/40 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                {/* Corner accent on hover */}
                {!isActive && (
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/0 group-hover:border-amber-500/30 transition-colors" />
                )}
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="tracking-wider uppercase">{item.label}</span>
                {isActive && (
                  <span className="ml-auto text-[9px] text-amber-500/50">◈</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          {profile?.role === "creator" && (
            <Link
              href="/creator/dashboard"
              className={`group relative flex items-center gap-3 px-3 py-2.5 text-xs font-mono transition-all ${
                pathname.startsWith("/creator")
                  ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500"
                  : "text-white/40 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="tracking-wider uppercase">Creator Studio</span>
            </Link>
          )}
          <div className="flex items-center gap-2 px-3 py-2">
            <ThemeSwitch />
            <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase">Theme</span>
          </div>
        </div>
      </aside>

      {/* Bottom tab bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 backdrop-blur-xl bg-neutral-950/95">
        <div className="flex items-stretch h-16">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-amber-400"
                    : "text-white/30"
                }`}
              >
                <item.icon className={`w-4 h-4 transition-transform ${isActive ? "scale-110" : ""}`} />
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5 bg-amber-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <div className="lg:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-neutral-950/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="h-px w-4 bg-amber-500/50" />
                  <span className="text-[9px] font-mono text-amber-500/50 tracking-widest uppercase">
                    {subtitle || "PayPerPlay"}
                  </span>
                </div>
                <h1 className="text-lg font-bold font-mono tracking-tight text-white">{title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitch />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-40">
          <SubscriptionBanner />
        </div>

        <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
