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
  Settings,
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

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Don't apply layout to public creator profile pages (/creator/[handle])
  // or the content creation/edit pages that have their own layout
  const isProfilePage = /^\/creator\/[^/]+$/.test(pathname) &&
    !["dashboard", "content", "analytics", "earnings", "playlists", "share-earn", "profile", "live"].includes(pathname.split("/")[2]);

  if (isProfilePage) {
    return <>{children}</>;
  }

  const isActive = (href: string) => {
    if (href === "/creator/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const displayName = session?.user?.name || "Creator";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(128,128,128,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[220px] z-40 flex-col border-r border-white/10 backdrop-blur-xl bg-background/80">
        {/* Brand */}
        <div className="p-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-tight">PayPerPlay</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Creator Studio</span>
            </div>
          </Link>
        </div>

        {/* Create button */}
        <div className="px-3 pt-4 pb-2">
          <Link
            href="/creator/content/new"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create
          </Link>
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        active
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? "text-amber-400" : ""}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <ThemeSwitch />
            <span className="text-[11px] text-muted-foreground">Theme</span>
          </div>
          <Link
            href="/feed"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Eye className="w-4 h-4" />
            View as Fan
          </Link>
          {/* User pill */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">
              {initials}
            </div>
            <span className="text-xs font-medium truncate">{displayName}</span>
          </div>
        </div>
      </aside>

      {/* Bottom tab bar — mobile */}
      <MobileBottomNav isActive={isActive} />

      {/* Main content */}
      <div className="lg:ml-[220px] min-h-screen">
        {/* Content Policy Banner */}
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

// ── Mobile Bottom Nav with FAB Action Sheet ──────────────────────────

function MobileBottomNav({ isActive }: { isActive: (href: string) => boolean }) {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!showActions) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showActions]);

  // Close on route change
  const pathname = usePathname();
  useEffect(() => {
    setShowActions(false);
  }, [pathname]);

  const navItems = MOBILE_NAV.filter((item) => !item.isFab);

  return (
    <>
      {/* Backdrop */}
      {showActions && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowActions(false)} />
      )}

      {/* Action sheet popup */}
      {showActions && (
        <div
          ref={menuRef}
          className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-56 bg-background border border-white/15 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <Link
            href="/creator/content/new"
            className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
            onClick={() => setShowActions(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Upload className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Upload Content</p>
              <p className="text-[11px] text-muted-foreground">Video, music, or media</p>
            </div>
          </Link>
          <Link
            href="/creator/live"
            className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-colors"
            onClick={() => setShowActions(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Go Live</p>
              <p className="text-[11px] text-muted-foreground">Stream to your audience</p>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 backdrop-blur-xl bg-background/95">
        <div className="flex items-stretch h-16 max-w-md mx-auto">
          {/* First two nav items */}
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-amber-400" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                {item.label}
              </Link>
            );
          })}

          {/* FAB — plus button */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setShowActions(!showActions)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5 active:scale-95 transition-all ${
                showActions
                  ? "bg-white/20 shadow-white/10 rotate-45"
                  : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
              }`}
            >
              {showActions ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Plus className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          {/* Last two nav items */}
          {navItems.slice(2).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-amber-400" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
