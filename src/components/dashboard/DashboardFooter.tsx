import * as React from "react";

import { Container } from "./Container";

const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Careers", href: "#careers" },
  { label: "Privacy", href: "#privacy" },
  { label: "Contact", href: "#contact" },
];

export function DashboardFooter() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950">
      {/* Top divider with technical notation */}
      <div className="border-b border-white/5">
        <Container className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 text-[9px] font-mono text-white/20">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-500/50 animate-pulse" />
              SYSTEM.ACTIVE
            </span>
            <span>·</span>
            <span>PPP.v1.0.0</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-amber-500/20"
                style={{ height: `${6 + (i % 4) * 2}px` }}
              />
            ))}
          </div>
        </Container>
      </div>

      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 flex items-center justify-center flex-shrink-0">
            <span className="text-black font-mono font-black text-sm">▶</span>
          </div>
          <div>
            <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">
              PayPerPlay
            </span>
            <p className="text-[9px] font-mono text-white/30 tracking-wider mt-0.5">
              AFRICA'S CREATOR ECONOMY
            </p>
          </div>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap gap-1">
          {footerLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-[10px] font-mono font-medium text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <Container className="flex items-center justify-between py-3">
          <p className="text-[9px] font-mono text-white/20 tracking-wider">
            © 2024 PAYPERPLAY · ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-3 text-[9px] font-mono text-white/20">
            <span>◐ RENDERING</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-amber-500/40 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-amber-500/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-1 h-1 bg-amber-500/20 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
