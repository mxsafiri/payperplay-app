"use client";

import * as React from "react";

import type { DashboardCategory, DashboardContentItem } from "@/data/dashboard";

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
  // Prefer explicit thumbnail
  const thumb = item.media.find((m) => m.mediaType === "thumbnail");
  if (thumb?.url) return thumb.url;
  // Fall back: extract YouTube video ID and build thumbnail URL
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

  const visible = React.useMemo(() => {
    if (category === "all") return content;
    return content.filter((c) => c.categoryId === category);
  }, [category, content]);

  return (
    <section id="about" className="bg-neutral-50 py-16 dark:bg-neutral-950/40">
      <Container className="space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
            Explore premium drops from creators you love. Tap a card to preview and
            pay per play.
          </p>
        </div>

        <CategoryFilters
          categories={categories}
          value={category}
          onChange={setCategory}
        />

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
