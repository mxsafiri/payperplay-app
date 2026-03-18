import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsCollage } from "@/components/dashboard/StatsCollage";
import { ContentDiscoverySection } from "@/components/dashboard/ContentDiscoverySection";
import { EngagementSection } from "@/components/dashboard/EngagementSection";
import { MonetizationSection } from "@/components/dashboard/MonetizationSection";
import { FinalCTASection } from "@/components/dashboard/FinalCTASection";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

import {
  dashboardCategories,
  dashboardContent,
  dashboardNavLinks,
  monetizationFeatures,
} from "@/data/dashboard";

export const metadata: Metadata = {
  title: "PayPerPlay",
  description: "Create, post and get paid. Tanzania's creator-first platform for premium content.",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}`;
}

export default async function DashboardPage() {
  const [[{ total: totalUsers }], [{ total: totalCreators }]] = await Promise.all([
    db.select({ total: count() }).from(profiles),
    db.select({ total: count() }).from(profiles).where(eq(profiles.role, "creator")),
  ]);

  const liveStats = [
    { metric: formatCount(totalCreators), label: "Creators", icon: "🔥" },
    { metric: formatCount(totalUsers), label: "Users", icon: "😍" },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <DashboardNav links={dashboardNavLinks} />

      <HeroSection />
      <StatsCollage stats={liveStats} />

      <ContentDiscoverySection
        title="Don’t Miss a Beat"
        categories={dashboardCategories}
        content={dashboardContent}
      />

      <EngagementSection />

      <MonetizationSection
        title="Give a Gift to Your Favorite Creator and Show Your Appreciation"
        features={monetizationFeatures}
      />

      <FinalCTASection />
      <DashboardFooter />
    </div>
  );
}
