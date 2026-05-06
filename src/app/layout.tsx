import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { appConfig, getThemeCss } from "@/app.config";
import { AudioPlayerProvider } from "@/components/music/AudioPlayerContext";
import { AudioPlayerBar } from "@/components/music/AudioPlayerBar";
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
    <html lang="en">
      <head>
        {/* Prevent flash of wrong theme — runs before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ppp-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
        <style dangerouslySetInnerHTML={{ __html: getThemeCss() }} />
        <style dangerouslySetInnerHTML={{ __html: `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideLeft {
  from { opacity: 0; transform: translateX(-32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideRight {
  from { opacity: 0; transform: translateX(32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1); }
}
.anim-fade-up    { animation: fadeUp    0.65s ease both; }
.anim-slide-left { animation: slideLeft 0.65s ease both; }
.anim-slide-right{ animation: slideRight 0.65s ease both; }
.anim-scale-in   { animation: scaleIn   0.55s ease both; }
.reveal-hidden   { opacity: 0; }
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AudioPlayerProvider>
          {children}
          <AudioPlayerBar />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
