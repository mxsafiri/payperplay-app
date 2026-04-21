"use client";

import * as React from "react";

import type { DashboardCategory, DashboardContentItem } from "@/data/dashboard";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

import { Container } from "./Container";
import { CategoryFilters } from "./CategoryFilters";
import { ContentCard } from "./ContentCard";

interface DbMediaItem {
  mediaType: string;
  url?: string | null;
}

interface DbContentItem {
  id: string;
  title: string;
  category: string;
  priceTzs: number;
  media?: DbMediaItem[];
  creator?: {
    id: string;
    handle: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

function getThumbnail(item: DbContentItem): string {
  if (!item.media?.length) return "";
  const thumb = item.media.find((m) => m.mediaType === "thumbnail");
  if (thumb?.url) return thumb.url;
  const yt = item.media.find((m) => m.mediaType === "youtube");
  if (yt?.url) {
    const videoId = yt.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/)?.[1];
    if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return "";
}

function mapToCardItem(item: DbContentItem, index: number): DashboardContentItem {
  return {
    id: item.id,
    categoryId: item.category.toLowerCase(),
    creatorName: item.creator?.displayName || item.creator?.handle || "Creator",
    title: item.title,
    priceLabel: item.priceTzs === 0 ? "Free" : `${item.priceTzs.toLocaleString()} TZS / play`,
    accent: index % 2 === 0 ? "primary" : "secondary",
    imagePath: getThumbnail(item),
  };
}

function deriveCategories(items: DbContentItem[]): DashboardCategory[] {
  const cats = new Set(items.map((i) => i.category));
  return [
    { id: "all", label: "All" },
    ...Array.from(cats).map((c) => ({ id: c.toLowerCase(), label: c })),
  ];
}

export function ContentDiscoverySection({
  title,
  categories: fallbackCategories,
  content: fallbackContent,
}: {
  title: string;
  categories: DashboardCategory[];
  content: DashboardContentItem[];
}) {
  const [liveContent, setLiveContent] = React.useState<DashboardContentItem[] | null>(null);
  const [liveCategories, setLiveCategories] = React.useState<DashboardCategory[] | null>(null);

  React.useEffect(() => {
    fetch("/api/content?limit=12")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content?.length) {
          const items: DbContentItem[] = data.content;
          setLiveContent(items.map(mapToCardItem));
          setLiveCategories(deriveCategories(items));
        }
      })
      .catch(() => {});
  }, []);

  const categories = liveCategories ?? fallbackCategories;
  const content = liveContent ?? fallbackContent;

  const [category, setCategory] = React.useState("all");
  const [sectionRef, sectionVisible] = useScrollReveal(0.08);

  const visible = React.useMemo(() => {
    if (category === "all") return content;
    return content.filter((c) => c.categoryId === category);
  }, [category, content]);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      id="about"
      className="bg-neutral-950 py-16 border-t border-white/5"
    >
      <Container className="space-y-8">
        {/* Section header */}
        <div
          className={`space-y-3 text-center ${sectionVisible ? "anim-fade-up" : "reveal-hidden"}`}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-amber-500/40" />
            <span className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase">
              CONTENT.DISCOVER
            </span>
            <div className="h-px w-8 bg-amber-500/40" />
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-xs font-mono text-white/40 sm:text-sm leading-relaxed">
            Explore premium drops from creators you love. Tap a card to preview and
            pay per play.
          </p>
        </div>

        <div className={sectionVisible ? "anim-fade-up" : "reveal-hidden"} style={{ animationDelay: "120ms" }}>
          <CategoryFilters
            categories={categories}
            value={category}
            onChange={setCategory}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((item, i) => (
            <div
              key={item.id}
              className={sectionVisible ? "anim-scale-in" : "reveal-hidden"}
              style={{ animationDelay: `${200 + i * 50}ms` }}
            >
              <ContentCard item={item} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
