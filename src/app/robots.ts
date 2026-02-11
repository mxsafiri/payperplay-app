import type { MetadataRoute } from "next";

import { appConfig } from "@/app.config";

export default function robots(): MetadataRoute.Robots {
  const base = appConfig.site.url.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
