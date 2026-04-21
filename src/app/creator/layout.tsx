"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import {
  LayoutDashboard,
  Film,
  Plus,
  ListVideo,
  User,
  Eye,
  BarChart3,
  Wallet,
  Share2,
  Radio,
  Upload,
  X,
  Shield,
} from "lucide-react";
import { Banner } from "@/components/ui/banner";

const NAV_SECTIONS = [
  {
    label: "Studio",
    items: [
      { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/creator/content", label: "Content", icon: Film },
      { href: "/creator/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/creator/earnings", label: "Earnings", icon: Wallet },
      { href: "/creator/live", label: "Go Live", icon: Radio },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/creator/playlists", label: "Playlists", icon: ListVideo },
      { href: "/creator/share-earn", label: "Share & Earn", icon: Share2 },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/creator/profile", label: "Profile", icon: User },
    ],
  },
];

const MOBILE_NAV = [
  { href: "/creator/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/creator/content", label: "Content", icon: Film },
  { href: "/creator/content/new", label: "Create", icon: Plus, isFab: true },
  { href: "/creator/earnings", label: "Earnings", icon: Wallet },
  { href: "/creator/profile", label: "Profile", icon: User },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showPolicyBanner, setShowPolicyBanner] = useState(() => {
    if (typeof window === "undefined") return true;
    return !localStorage.getItem("pp_policy_banner_dismissed");
  });

  const dismissBanner = () => {
    setShowPolicyBanner(false);
    localStorage.setItem("pp_policy_banner_dismissed", Date.now().toString());
  };

  const isProfilePage = /^\/creator\/[^/]+$/.test(pathname) &&
    !["dashboard", "content", "analytics", "earnings", "playlists", "share-earn", "profile", "live"].includes(pathname.split("/")[2]);

  if (isProfilePage) return <>{children}</>;

  const isActive = (href: string) => {
    if (href === "/creator/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const displayName = session?.user?.name || "Creator";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid opacity-30 pointer-events-none" />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-500/4 blur-[120px] pointer-events-none" />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[220px] z-40 flex-col border-r border-white/10 bg-neutral-950/95 backdrop-blur-xl">
        {/* Brand */}
        <div className="p-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-black font-mono font-black text-sm">▶</span>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-amber-300/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">PayPerPlay</span>
              <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest">Creator.Studio</div>
            </div>
          </Link>
        </div>

        {/* System status */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Studio.Active</span>
          </div>
        </div>

        {/* Create button */}
        <div className="px-3 pt-4 pb-2">
          <Link
            href="/creator/content/new"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 text-black text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Create
          </Link>
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[9px] font-mono font-semibold uppercase tracking-widest text-white/20 px-3 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono transition-all border-l-2 ${
                        active
                          ? "border-amber-500 bg-amber-500/8 text-amber-400"
                          : "border-transparent text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20"
                      }`}
                    >
                      {!active && (
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/0 group-hover:border-amber-500/30 transition-colors" />
                      )}
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="tracking-wider uppercase">{item.label}</span>
                      {active && <span className="ml-auto text-[9px] text-amber-500/50">◈</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-0.5">
          <div className="flex items-center gap-2 px-3 py-2">
            <ThemeSwitch />
            <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase">Theme</span>
          </div>
          <Link
            href="/feed"
            className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono text-white/30 hover:text-white hover:bg-white/5 transition-all border-l-2 border-transparent hover:border-white/20"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">Fan View →</span>
          </Link>
          {/* User pill */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 border-t border-white/5 pt-2">
            <div className="w-7 h-7 bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400">
              {initials}
            </div>
            <span className="text-xs font-mono text-white/50 tracking-wide truncate">{displayName}</span>
          </div>
        </div>
      </aside>

      {/* Bottom tab bar — mobile */}
      <MobileBottomNav isActive={isActive} />

      {/* Main content */}
      <div className="lg:ml-[220px] min-h-screen">
        {showPolicyBanner && (
          <div className="px-4 pt-4 lg:px-6 lg:pt-6">
            <Banner
              show={showPolicyBanner}
              onHide={dismissBanner}
              icon={<Shield className="w-4 h-4 text-amber-400" />}
              title={
                <>
                  Reminder: You are responsible for all content you upload. Ensure you own or have rights to everything you publish.
                </>
              }
              learnMoreUrl="/creator/content-policy"
              variant="info"
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function MobileBottomNav({ isActive }: { isActive: (href: string) => boolean }) {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showActions) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowActions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showActions]);

  const pathname = usePathname();
  useEffect(() => { setShowActions(false); }, [pathname]);

  const navItems = MOBILE_NAV.filter((item) => !item.isFab);

  return (
    <>
      {showActions && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setShowActions(false)} />
      )}

      {/* Action sheet popup */}
      {showActions && (
        <div
          ref={menuRef}
          className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-56 border border-white/15 bg-neutral-950 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40" />
          <Link
            href="/creator/content/new"
            className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/10"
            onClick={() => setShowActions(false)}
          >
            <div className="w-9 h-9 border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-mono font-semibold text-white">Upload Content</p>
              <p className="text-[10px] font-mono text-white/30">Video, music, or media</p>
            </div>
          </Link>
          <Link
            href="/creator/live"
            className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
            onClick={() => setShowActions(false)}
          >
            <div className="w-9 h-9 border border-red-500/30 bg-red-500/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-mono font-semibold text-white">Go Live</p>
              <p className="text-[10px] font-mono text-white/30">Stream to your audience</p>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 backdrop-blur-xl bg-neutral-950/95">
        <div className="flex items-stretch h-16 max-w-md mx-auto">
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono uppercase tracking-wider transition-colors ${
                  active ? "text-amber-400" : "text-white/30"
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? "scale-110" : ""} transition-transform`} />
                {item.label}
              </Link>
            );
          })}

          {/* FAB */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setShowActions(!showActions)}
              className={`w-11 h-11 flex items-center justify-center -mt-4 transition-all active:scale-95 ${
                showActions ? "bg-white/15 border border-white/20" : "bg-amber-500 hover:bg-amber-400"
              }`}
            >
              {showActions ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-black font-bold" />
              )}
            </button>
          </div>

          {navItems.slice(2).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono uppercase tracking-wider transition-colors ${
                  active ? "text-amber-400" : "text-white/30"
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? "scale-110" : ""} transition-transform`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
