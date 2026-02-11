"use client";

import * as React from "react";

import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Logo } from "@/components/brand/logo";
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
        "sticky top-0 z-50 w-full border-b border-transparent transition-colors",
        scrolled
          ? "border-neutral-200 bg-white/75 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70"
          : "bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="inline-flex items-center gap-2">
            <span className="text-primary-500 dark:text-primary-400">
              <Logo className="h-6" />
            </span>
          </a>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => handleScrollTo(e, l.href)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/login"
            className="inline-flex h-10 items-center rounded-full border border-neutral-200 bg-white/60 px-4 text-sm font-medium text-neutral-900 backdrop-blur hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-100 dark:hover:bg-neutral-950"
          >
            Login
          </a>
          <a
            href="/signup"
            className="inline-flex h-10 items-center rounded-full bg-primary-500 px-4 text-sm font-semibold text-white hover:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-400"
          >
            Get Started
          </a>
          <ThemeSwitch />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitch className="h-10" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-200 bg-white/60 px-4 text-sm font-medium text-neutral-900 backdrop-blur hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-100 dark:hover:bg-neutral-950"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90 md:hidden">
          <Container className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-2">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => handleScrollTo(e, l.href)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="flex gap-2">
              <a
                href="/login"
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
              >
                Login
              </a>
              <a
                href="/signup"
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-primary-500 px-4 text-sm font-semibold text-white hover:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                Get Started
              </a>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
