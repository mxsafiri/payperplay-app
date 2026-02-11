export type DashboardNavLink = {
  label: string;
  href: string;
};

export type DashboardStat = {
  metric: string;
  label: string;
  icon: string;
};

export type DashboardCategory = {
  id: string;
  label: string;
};

export type DashboardContentItem = {
  id: string;
  categoryId: string;
  creatorName: string;
  title: string;
  priceLabel: string;
  accent: "primary" | "secondary";
  imagePath: string;
};

export type MonetizationFeature = {
  title: string;
  description: string;
  icon: string;
  accent: "primary" | "secondary";
};

export const dashboardNavLinks: DashboardNavLink[] = [
  { label: "About", href: "#about" },
  { label: "Community", href: "#community" },
  { label: "How it Works", href: "#how-it-works" },
];

export const dashboardStats: DashboardStat[] = [
  { metric: "80K+", label: "Creators", icon: "🔥" },
  { metric: "200K+", label: "Users", icon: "😍" },
];

export const dashboardCategories: DashboardCategory[] = [
  { id: "all", label: "All" },
  { id: "gaming", label: "Gaming" },
  { id: "vlogging", label: "Vlogging" },
  { id: "art", label: "Art" },
  { id: "education", label: "Education" },
  { id: "music", label: "Music" },
  { id: "podcast", label: "Podcast" },
  { id: "sport", label: "Sport" },
];

export const dashboardContent: DashboardContentItem[] = [
  {
    id: "c1",
    categoryId: "gaming",
    creatorName: "NovaPlay",
    title: "Boss Rush Highlights",
    priceLabel: "300 TZS / play",
    accent: "primary",
    imagePath: "/[image] - 2230049.jpeg",
  },
  {
    id: "c2",
    categoryId: "music",
    creatorName: "DJ Kairo",
    title: "Studio Session: Midnight Mix",
    priceLabel: "500 TZS / play",
    accent: "secondary",
    imagePath: "/[image] - 2363871.jpeg",
  },
  {
    id: "c3",
    categoryId: "education",
    creatorName: "SkillSprint",
    title: "Learn in 5: Design Systems",
    priceLabel: "300 TZS / play",
    accent: "primary",
    imagePath: "/[image] - 238757.jpeg",
  },
  {
    id: "c4",
    categoryId: "art",
    creatorName: "Ink & Glow",
    title: "Speedpaint: Neon City",
    priceLabel: "500 TZS / play",
    accent: "secondary",
    imagePath: "/[image] - 2527823.jpeg",
  },
  {
    id: "c5",
    categoryId: "podcast",
    creatorName: "Founders FM",
    title: "Creator Economy Deep Dive",
    priceLabel: "300 TZS / play",
    accent: "primary",
    imagePath: "/[image] - 2685335.jpeg",
  },
  {
    id: "c6",
    categoryId: "vlogging",
    creatorName: "Mina Daily",
    title: "Day One: Launch Week",
    priceLabel: "500 TZS / play",
    accent: "secondary",
    imagePath: "/[image] - 3147662.jpeg",
  },
  {
    id: "c7",
    categoryId: "sport",
    creatorName: "Pulse Sports",
    title: "Top Plays: Weekend Recap",
    priceLabel: "300 TZS / play",
    accent: "primary",
    imagePath: "/[image] - 3692936.jpeg",
  },
  {
    id: "c8",
    categoryId: "gaming",
    creatorName: "Arcade Ace",
    title: "Speedrun: Zero Mistakes",
    priceLabel: "500 TZS / play",
    accent: "secondary",
    imagePath: "/[image] - 381190.jpeg",
  },
];

export const monetizationFeatures: MonetizationFeature[] = [
  {
    title: "Tipping",
    description: "Send instant love to creators with one-tap tips.",
    icon: "🎁",
    accent: "secondary",
  },
  {
    title: "Pay-per-play",
    description: "Unlock premium content in small, satisfying moments.",
    icon: "🚀",
    accent: "primary",
  },
  {
    title: "Creator wallet",
    description: "Track earnings and payouts with a clear, modern wallet view.",
    icon: "💳",
    accent: "primary",
  },
];
