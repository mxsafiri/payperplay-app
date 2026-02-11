import type { MetadataRoute } from "next";

import { appConfig } from "@/app.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.site.name,
    short_name: appConfig.site.name,
    description: appConfig.site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
