"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/cn";

type Theme = "dark" | "light";

const storageKey = "ppp-theme";

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeSwitch({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const next = saved === "light" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(storageKey, next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 border border-white/20 px-3 text-[11px] font-mono font-medium text-white/60 uppercase tracking-widest hover:border-amber-500/50 hover:text-amber-400 transition-all",
        className,
      )}
      aria-label="Toggle theme"
      aria-pressed={theme === "dark"}
    >
      {theme === "dark"
        ? <Moon className="h-3 w-3 flex-shrink-0" />
        : <Sun className="h-3 w-3 flex-shrink-0" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
