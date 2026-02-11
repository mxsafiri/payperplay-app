import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { appConfig, getThemeCss } from "@/app.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.site.url),
  title: {
    default: appConfig.site.name,
    template: `%s | ${appConfig.site.name}`,
  },
  description: appConfig.site.description,
  openGraph: {
    type: "website",
    locale: appConfig.site.locale,
    url: appConfig.site.url,
    siteName: appConfig.site.name,
    title: appConfig.site.name,
    description: appConfig.site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: appConfig.site.name,
    description: appConfig.site.description,
    creator: appConfig.brand.social.twitterHandle,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style dangerouslySetInnerHTML={{ __html: getThemeCss() }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
