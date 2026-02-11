import * as React from "react";

import { Logo } from "@/components/brand/logo";

import { Container } from "./Container";

const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Careers", href: "#careers" },
  { label: "Privacy", href: "#privacy" },
  { label: "Contact", href: "#contact" },
];

export function DashboardFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-950">
      <Container className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-primary-500 dark:text-primary-400">
          <Logo className="h-6" />
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Payperplay
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          {footerLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
}
