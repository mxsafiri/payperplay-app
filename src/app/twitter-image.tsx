import { ImageResponse } from "next/og";

import { appConfig } from "@/app.config";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#111827",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>
          {appConfig.site.name}
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 30,
            color: "#e5e7eb",
            maxWidth: 960,
            lineHeight: 1.3,
          }}
        >
          {appConfig.site.description}
        </div>
      </div>
    ),
    size,
  );
}
