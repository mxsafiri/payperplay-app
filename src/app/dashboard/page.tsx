import type { Metadata } from "next";

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
  dashboardStats,
  monetizationFeatures,
} from "@/data/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Premium creator-first content hub experience.",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <DashboardNav links={dashboardNavLinks} />

      <HeroSection />
      <StatsCollage stats={dashboardStats} />

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
