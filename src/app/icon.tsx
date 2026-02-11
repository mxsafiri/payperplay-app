import { ImageResponse } from "next/og";

import { appConfig } from "@/app.config";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  const letter = appConfig.site.name.slice(0, 1).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f59e0b",
          borderRadius: 8,
        }}
      >
        <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path d="M18 10L0 20V0L18 10Z" fill="white" />
        </svg>
      </div>
    ),
    size,
  );
}
