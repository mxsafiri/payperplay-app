"use client";

import * as React from "react";

import { ThemeSwitch } from "@/components/ThemeSwitch";
import { cn } from "@/lib/cn";
import type { DashboardNavLink } from "@/data/dashboard";

import { Container } from "./Container";

export function DashboardNav({ links }: { links: DashboardNavLink[] }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-amber-500/20 bg-neutral-950/90 backdrop-blur-xl"
          : "border-white/10 bg-neutral-950/60 backdrop-blur-md",
      )}
    >
      {/* Top micro-bar */}
      <div className="hidden lg:block border-b border-white/5 bg-black/20">
        <Container className="flex items-center justify-between py-1">
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/30">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              SYSTEM.ACTIVE
            </span>
            <span>V1.0.0</span>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-mono text-white/30">
            <span>DAR ES SALAAM · TZ</span>
            <div className="h-2 w-px bg-white/20" />
            <span>◐ LIVE</span>
          </div>
        </Container>
      </div>

      <Container className="flex h-14 items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
                <span className="text-black font-mono font-black text-sm">▶</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-amber-300/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">
                PayPerPlay
              </span>
            </div>
          </a>
          <div className="hidden sm:block h-4 w-px bg-white/20" />
          <span className="hidden sm:inline text-[9px] font-mono text-white/30 tracking-wider">EST.2024</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => handleScrollTo(e, l.href)}
              className="px-3 py-1.5 text-[11px] font-mono font-medium text-white/50 uppercase tracking-wider hover:text-white hover:bg-white/5 transition-all"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/login"
            className="inline-flex h-8 items-center border border-white/20 px-4 text-[11px] font-mono font-medium text-white/70 tracking-wider uppercase hover:border-amber-500/50 hover:text-white transition-all"
          >
            Login
          </a>
          <a
            href="/signup"
            className="group relative inline-flex h-8 items-center bg-amber-500 px-4 text-[11px] font-mono font-semibold text-black tracking-wider uppercase hover:bg-amber-400 transition-colors"
          >
            <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            Get Started
          </a>
          <ThemeSwitch />
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitch className="h-8" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-8 items-center justify-center border border-white/20 px-4 text-[11px] font-mono font-medium text-white/70 uppercase tracking-wider hover:border-amber-500/40 hover:text-white transition-all"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "CLOSE" : "MENU"}
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-white/10 bg-neutral-950/95 backdrop-blur-xl md:hidden">
          <Container className="flex flex-col gap-4 py-5">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => handleScrollTo(e, l.href)}
                  className="px-3 py-2.5 text-xs font-mono font-medium text-white/60 uppercase tracking-wider hover:text-white hover:bg-white/5 transition-all border-l-2 border-transparent hover:border-amber-500/60"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <a
                href="/login"
                className="flex h-10 flex-1 items-center justify-center border border-white/20 text-xs font-mono font-medium text-white/70 uppercase tracking-wider hover:border-amber-500/40 hover:text-white transition-all"
              >
                Login
              </a>
              <a
                href="/signup"
                className="flex h-10 flex-1 items-center justify-center bg-amber-500 text-xs font-mono font-semibold text-black uppercase tracking-wider hover:bg-amber-400 transition-colors"
              >
                Get Started
              </a>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
