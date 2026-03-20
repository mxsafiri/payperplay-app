/**
 * /v/[slug] — View-once landing page.
 * Public, no auth needed. Mobile-first shareable page.
 * Shows teaser → payment wall → full video → conversion CTA.
 */
import { db } from "@/db";
import { viewOnceLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getPresignedReadUrl } from "@/lib/storage/r2";
import { resolveAvatarUrl } from "@/lib/avatar";
import { getGuestSession } from "@/lib/guest-session";
import { ViewOnceClient } from "@/components/view-once/ViewOnceClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await db.query.viewOnceLinks.findFirst({
    where: eq(viewOnceLinks.slug, slug),
    with: { content: true, creator: true },
  });

  if (!link) return { title: "PayPerPlay" };

  return {
    title: `${link.content.title} — PayPerPlay`,
    description: `Watch exclusive content by ${link.creator.displayName || link.creator.handle}. Pay ${link.priceTzs.toLocaleString()} TZS to unlock.`,
    openGraph: {
      title: link.content.title,
      description: `Exclusive on PayPerPlay — ${link.priceTzs.toLocaleString()} TZS`,
      type: "video.other",
    },
  };
}

export default async function ViewOncePage({ params }: Props) {
  const { slug } = await params;

  const link = await db.query.viewOnceLinks.findFirst({
    where: eq(viewOnceLinks.slug, slug),
    with: {
      content: { with: { media: true } },
      creator: true,
    },
  });

  if (!link || !link.isActive) notFound();

  // Check expiry
  if (link.expiresAt && new Date() > link.expiresAt) notFound();

  // Check if guest already has a valid session for this link
  const guestSession = await getGuestSession(link.id);
  let streamUrl: string | null = null;

  if (guestSession) {
    // Guest already paid — resolve the video URL
    const videoMedia = link.content.media.find(
      (m) => m.mediaType === "video" && m.storageKey
    );
    if (videoMedia?.storageKey) {
      streamUrl = await getPresignedReadUrl({
        key: videoMedia.storageKey,
        expiresInSeconds: 4 * 60 * 60,
      });
    }
  }

  // Resolve thumbnail
  const thumbnailMedia = link.content.media.find((m) => m.mediaType === "thumbnail");
  let thumbnailUrl: string | null = null;
  if (thumbnailMedia?.storageKey) {
    thumbnailUrl = await getPresignedReadUrl({
      key: thumbnailMedia.storageKey,
      expiresInSeconds: 3600,
    });
  }

  // Resolve teaser video (first N seconds — same video, player enforces limit)
  let teaserUrl: string | null = null;
  if (!guestSession) {
    const videoMedia = link.content.media.find(
      (m) => m.mediaType === "video" && m.storageKey
    );
    if (videoMedia?.storageKey) {
      teaserUrl = await getPresignedReadUrl({
        key: videoMedia.storageKey,
        expiresInSeconds: 600, // 10 min for teaser
      });
    }
  }

  // Resolve avatar
  let avatarUrl: string | null = null;
  if (link.creator.avatarUrl) {
    avatarUrl = await resolveAvatarUrl(link.creator.avatarUrl);
  }

  return (
    <ViewOnceClient
      slug={slug}
      content={{
        title: link.content.title,
        description: link.content.description,
        category: link.content.category,
        contentType: link.content.contentType,
      }}
      creator={{
        handle: link.creator.handle,
        displayName: link.creator.displayName,
        avatarUrl,
      }}
      priceTzs={link.priceTzs}
      teaserSeconds={link.teaserSeconds}
      thumbnailUrl={thumbnailUrl}
      teaserUrl={teaserUrl}
      streamUrl={streamUrl}
      hasPaid={!!guestSession}
      watched={guestSession?.watched ?? false}
    />
  );
}
