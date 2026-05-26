import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { content } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getPresignedReadUrl } from "@/lib/storage/r2";
import { resolveAvatarUrl } from "@/lib/avatar";
import { ContentDetailClient } from "@/components/content/ContentDetailClient";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch session + content in parallel — zero waterfall
  const [session, contentItem] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.query.content.findFirst({
      where: eq(content.id, id),
      with: {
        creator: {
          columns: { id: true, handle: true, displayName: true, avatarUrl: true },
        },
        media: {
          columns: { id: true, mediaType: true, url: true, storageKey: true },
        },
      },
    }),
  ]);

  if (!contentItem) redirect("/feed");

  // Resolve profile (needed for access checks)
  let profile: { id: string; role: string } | null = null;
  if (session) {
    profile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
      columns: { id: true, role: true },
    }) ?? null;
  }

  // Determine access
  let hasAccess = contentItem.priceTzs === 0;
  if (!hasAccess && profile) {
    if (profile.id === contentItem.creatorId) {
      hasAccess = true;
    } else {
      const entitlement = await db.query.entitlements.findFirst({
        where: (e, { and, eq }) =>
          and(eq(e.userId, profile!.id), eq(e.contentId, id)),
      });
      hasAccess = !!entitlement;
    }
  }

  const isAudio = contentItem.contentType === "audio_upload";
  const isUpload = contentItem.contentType === "upload" || isAudio;

  // Resolve thumbnail presigned URLs
  const resolvedMedia = await Promise.all(
    (contentItem.media || []).map(async (m) => {
      if (m.mediaType === "thumbnail" && m.storageKey && !m.url) {
        try {
          const url = await getPresignedReadUrl({
            key: m.storageKey,
            expiresInSeconds: 7 * 24 * 3600,
          });
          return { ...m, url };
        } catch {
          return m;
        }
      }
      return m;
    })
  );

  const avatarUrl = await resolveAvatarUrl(contentItem.creator?.avatarUrl);

  // Find primary media — audio files use mediaType "audio", video uses "video"
  const primaryMedia = resolvedMedia.find(
    (m) => m.mediaType === (isAudio ? "audio" : "video") && m.storageKey
  );

  // Generate stream URL server-side — src is in the HTML, no client round-trip
  let streamUrl: string | null = null;
  let previewUrl: string | null = null;

  if (isUpload && primaryMedia?.storageKey) {
    if (hasAccess && profile) {
      try {
        streamUrl = await getPresignedReadUrl({
          key: primaryMedia.storageKey,
          expiresInSeconds: 3600,
        });
      } catch { /* non-fatal — client can retry */ }
    } else if (!hasAccess && !isAudio && contentItem.priceTzs > 0) {
      // Video-only preview for paid content without access (audio has no preview)
      try {
        previewUrl = await getPresignedReadUrl({
          key: primaryMedia.storageKey,
          expiresInSeconds: 3600,
        });
      } catch { /* non-fatal */ }
    }
  }

  // Fetch other content by this creator (excluding current)
  const moreFromCreator = await db.query.content.findMany({
    where: and(
      eq(content.creatorId, contentItem.creatorId),
      ne(content.id, id),
      eq(content.status, "published")
    ),
    columns: {
      id: true,
      title: true,
      priceTzs: true,
      viewCount: true,
      contentType: true,
      category: true,
    },
    with: {
      media: {
        columns: { id: true, mediaType: true, url: true, storageKey: true },
      },
    },
    limit: 6,
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });

  // Resolve thumbnails for "more from creator" content
  const resolvedMoreFromCreator = await Promise.all(
    moreFromCreator.map(async (item) => {
      const thumb = item.media?.find((m) => m.mediaType === "thumbnail");
      let thumbnailUrl: string | null = thumb?.url || null;
      if (thumb?.storageKey && !thumb.url) {
        try {
          thumbnailUrl = await getPresignedReadUrl({
            key: thumb.storageKey,
            expiresInSeconds: 7 * 24 * 3600,
          });
        } catch { /* non-fatal */ }
      }
      return {
        id: item.id,
        title: item.title,
        priceTzs: item.priceTzs,
        viewCount: item.viewCount ?? 0,
        contentType: item.contentType,
        category: item.category,
        thumbnailUrl,
      };
    })
  );

  const contentData = {
    id: contentItem.id,
    title: contentItem.title,
    description: contentItem.description,
    category: contentItem.category,
    priceTzs: contentItem.priceTzs,
    viewCount: contentItem.viewCount ?? 0,
    likeCount: contentItem.likeCount ?? 0,
    commentCount: (contentItem as { commentCount?: number }).commentCount ?? 0,
    contentType: contentItem.contentType,
    creator: { ...contentItem.creator, avatarUrl },
    media: resolvedMedia,
    hasAccess,
  };

  return (
    <ContentDetailClient
      content={contentData}
      contentId={id}
      initialStreamUrl={streamUrl}
      initialPreviewUrl={previewUrl}
      moreFromCreator={resolvedMoreFromCreator}
    />
  );
}
