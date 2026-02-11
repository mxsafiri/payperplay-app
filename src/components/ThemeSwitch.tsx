"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/cn";

type Theme = "dark" | "light";

const storageKey = "ppp-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
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
        "inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-4 text-sm font-medium text-neutral-900 backdrop-blur transition-colors hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100 dark:hover:bg-neutral-950",
        className,
      )}
      aria-label="Toggle theme"
      aria-pressed={theme === "dark"}
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
