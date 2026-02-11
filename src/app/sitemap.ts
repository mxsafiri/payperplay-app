import type { MetadataRoute } from "next";

import { appConfig } from "@/app.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appConfig.site.url.replace(/\/$/, "");

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
