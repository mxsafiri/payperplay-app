"use client";

import * as React from "react";

import type { DashboardCategory, DashboardContentItem } from "@/data/dashboard";

import { Container } from "./Container";
import { CategoryFilters } from "./CategoryFilters";
import { ContentCard } from "./ContentCard";

export function ContentDiscoverySection({
  title,
  categories,
  content,
}: {
  title: string;
  categories: DashboardCategory[];
  content: DashboardContentItem[];
}) {
  const [category, setCategory] = React.useState(categories[0]?.id ?? "all");

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
