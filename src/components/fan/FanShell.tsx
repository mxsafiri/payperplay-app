"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import {
  Film,
  Menu,
  X,
  LayoutGrid,
  Library,
  User,
  Crown,
  LayoutDashboard,
} from "lucide-react";

type Profile = {
  role: "fan" | "creator";
};

const FAN_NAV_ITEMS = [
  { href: "/feed", label: "Discover", icon: LayoutGrid },
  { href: "/library", label: "My Library", icon: Library },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/subscribe", label: "Subscription", icon: Crown },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          if (data?.profile?.role) {
            setProfile({ role: data.profile.role });
          }
        })
        .catch(() => {});
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 z-40 flex-col border-r border-white/10 backdrop-blur-xl bg-background/80">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PayPerPlay</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {FAN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2">
            <ThemeSwitch />
            <span className="text-xs text-muted-foreground">Theme</span>
          </div>
          {profile?.role === "creator" && (
            <Link
              href="/creator/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              Creator Dashboard
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r border-white/10 backdrop-blur-xl bg-background/95">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">PayPerPlay</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {FAN_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 px-3 py-2">
                <ThemeSwitch />
                <span className="text-xs text-muted-foreground">Theme</span>
              </div>
              {profile?.role === "creator" && (
                <Link
                  href="/creator/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  Creator Dashboard
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main content area — offset for sidebar on desktop */}
      <div className="lg:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-background/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                  {subtitle ? (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  ) : null}
                </div>
              </div>
              <div className="lg:hidden">
                <ThemeSwitch />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-40">
          <SubscriptionBanner />
        </div>

        <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
