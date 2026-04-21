"use client";

import * as React from "react";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

import { Container } from "./Container";
import { Typewriter } from "@/components/ui/typewriter";
import { placeholderCreators } from "@/data/placeholder-creators";

function anim(cls: string, delay: number) {
  return { className: cls, style: { animationDelay: `${delay}ms` } };
}

const IMAGE_HOLD_MS = 4000;

export function HeroSection() {
  const featuredCreators = placeholderCreators.slice(0, 6);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setShowVideo(true), IMAGE_HOLD_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  useEffect(() => {
    if (showVideo) {
      videoRef.current?.play().catch(() => {});
    } else {
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    }
  }, [showVideo]);

  const handleVideoEnded = () => {
    setShowVideo(false);
    timerRef.current = setTimeout(() => setShowVideo(true), IMAGE_HOLD_MS);
  };

  return (
    <section className="relative overflow-hidden min-h-hero bg-neutral-950">
      {/* Background layers — image + video crossfade */}
      <Image
        src="/BG.jpg"
        alt=""
        fill
        className="object-cover transition-opacity duration-[1500ms]"
        style={{ opacity: showVideo ? 0 : 0.2 }}
        sizes="100vw"
        priority
      />
      <video
        ref={videoRef}
        src="/hero-bg.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms]"
        style={{ opacity: showVideo ? 0.22 : 0 }}
      />
      <div className="absolute inset-0 tech-grid" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-pink-500/8" />
      <div className="absolute inset-0 scan-overlay pointer-events-none" />

      {/* Gradient blobs */}
      <div className="absolute top-[-15%] left-[10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-pink-500/5 blur-[100px] pointer-events-none" />

      {/* Corner frame accents */}
      <div className="absolute top-0 left-0 w-10 h-10 border-t border-l border-amber-500/40 z-20" />
      <div className="absolute top-0 right-0 w-10 h-10 border-t border-r border-amber-500/40 z-20" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-b border-l border-amber-500/40 z-20" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b border-r border-amber-500/40 z-20" />

      <Container className="relative flex flex-col justify-center gap-12 py-20 lg:min-h-hero lg:py-28 lg:flex-row lg:items-center">
        <div className="max-w-2xl lg:flex-1">

          {/* Technical section label */}
          <div {...anim("anim-fade-up flex items-center gap-3 mb-6", 0)}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono text-amber-500/80 tracking-widest uppercase">
                PPP.v1 · LIVE
              </span>
            </div>
            <div className="flex-1 h-px bg-amber-500/20" />
            <span className="text-[9px] font-mono text-white/30 tracking-wider">
              TZ.PLATFORM
            </span>
          </div>

          {/* Pills */}
          <div {...anim("anim-fade-up flex flex-wrap gap-2 mb-6", 120)}>
            {["Creator-First", "Lipa-per-Play", "Premium Vibes"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-[10px] font-mono tracking-widest text-amber-400/80 uppercase"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Main heading */}
          <div {...anim("anim-fade-up", 220)}>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl font-mono leading-[1.1]">
              <Typewriter
                texts={["Create, post and make money!", "Discover content fresh kila siku!"]}
                highlights={["make money!", "kila siku!"]}
                speed={70}
              />
            </h1>
          </div>

          {/* Decorative dot row */}
          <div {...anim("anim-fade-up flex gap-0.5 my-4 opacity-30", 300)}>
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="w-0.5 h-0.5 bg-amber-400 rounded-full" />
            ))}
          </div>

          <p {...anim("anim-fade-up max-w-xl text-sm text-neutral-400 sm:text-base leading-relaxed font-mono", 360)}>
            The number one content platform in Africa — we support creators and their work.
          </p>

          {/* CTA buttons */}
          <div {...anim("anim-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:items-center", 460)}>
            <a
              href="#get-started"
              className="group relative inline-flex h-11 items-center justify-center bg-amber-500 px-7 text-sm font-mono font-semibold text-black tracking-wider uppercase hover:bg-amber-400 transition-colors"
            >
              <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              ▶ Play Sasa
            </a>
            <a
              href="/signup"
              className="inline-flex h-11 items-center justify-center border border-white/20 bg-transparent px-7 text-sm font-mono font-medium text-white/80 tracking-wider uppercase hover:border-amber-500/50 hover:text-white transition-colors"
            >
              Get Started →
            </a>
          </div>

          {/* Bottom technical notation */}
          <div {...anim("anim-fade-up flex items-center gap-2 mt-8 opacity-40", 560)}>
            <span className="text-[9px] font-mono text-white">◈</span>
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-[9px] font-mono text-white/60">PAYPERPLAY.PROTOCOL</span>
          </div>
        </div>

        {/* Featured Creators Grid */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-center">
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {featuredCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="anim-scale-in group relative aspect-square overflow-hidden border border-white/10 hover:border-amber-500/40 transition-colors amber-glow-hover"
                style={{
                  transform: index % 2 === 0 ? 'translateY(-8px)' : 'translateY(8px)',
                  animationDelay: `${500 + index * 80}ms`,
                }}
              >
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 160px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-amber-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] font-mono font-semibold text-white truncate">{creator.name}</p>
                  <p className="text-[9px] font-mono text-white/50">{creator.followers}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <Container className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/30">
            <span className="hidden sm:inline">SYSTEM.ACTIVE</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-amber-500/40"
                  style={{ height: `${8 + (i % 3) * 4}px` }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-mono text-white/30">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-amber-500/60 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-amber-500/40 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-1 h-1 bg-amber-500/20 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            <span className="hidden sm:inline">◐ STREAMING</span>
          </div>
        </Container>
      </div>
    </section>
  );
}
