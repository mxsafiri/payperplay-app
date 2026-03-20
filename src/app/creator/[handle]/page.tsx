import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq, and, desc, sql } from "drizzle-orm";
import type { Metadata } from "next";

import { db } from "@/db";
import { profiles, content, follows, playlists, playlistItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { resolveAvatarUrl } from "@/lib/avatar";
import { getPresignedReadUrl } from "@/lib/storage/r2";
import { CreatorProfileClient } from "@/components/creator/CreatorProfileClient";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const creator = await db.query.profiles.findFirst({
    where: and(eq(profiles.handle, handle), eq(profiles.role, "creator")),
    columns: { displayName: true, handle: true, bio: true },
  });

  if (!creator) return { title: "Creator Not Found — PayPerPlay" };

  const name = creator.displayName || `@${creator.handle}`;
  return {
    title: `${name} — PayPerPlay`,
    description: creator.bio || `Watch exclusive content from ${name} on PayPerPlay`,
    openGraph: {
      title: `${name} on PayPerPlay`,
      description: creator.bio || `Watch exclusive content from ${name}`,
    },
  };
}

export default async function CreatorPublicProfilePage({ params }: PageProps) {
  const { handle } = await params;

  // Fetch creator profile
  const creator = await db.query.profiles.findFirst({
    where: and(eq(profiles.handle, handle), eq(profiles.role, "creator")),
    columns: {
      id: true,
      handle: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
    with: {
      creatorProfile: {
        columns: { verificationStatus: true },
      },
    },
  });

  if (!creator) notFound();

  // Fetch session, content, follower count, playlists in parallel
  const [session, creatorContent, followerCountResult, creatorPlaylists] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),

    // All published content by this creator
    db.query.content.findMany({
      where: and(
        eq(content.creatorId, creator.id),
        eq(content.status, "published")
      ),
      columns: {
        id: true,
        title: true,
        priceTzs: true,
        viewCount: true,
        contentType: true,
        category: true,
        createdAt: true,
      },
      with: {
        media: {
          columns: { id: true, mediaType: true, url: true, storageKey: true },
        },
      },
      orderBy: [desc(content.createdAt)],
    }),

    // Follower count
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(follows)
      .where(eq(follows.creatorId, creator.id)),

    // Published playlists with item count
    db.query.playlists.findMany({
      where: and(
        eq(playlists.creatorId, creator.id),
        eq(playlists.isPublished, true)
      ),
      columns: {
        id: true,
        title: true,
        description: true,
        coverImageUrl: true,
        category: true,
      },
      with: {
        items: {
          columns: { id: true },
        },
      },
      orderBy: [desc(playlists.createdAt)],
    }),
  ]);

  const followerCount = followerCountResult[0]?.count ?? 0;

  // Check if current user follows this creator
  let isFollowing = false;
  let currentProfileId: string | null = null;
  if (session) {
    const profile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
      columns: { id: true },
    });
    if (profile) {
      currentProfileId = profile.id;
      const followRecord = await db.query.follows.findFirst({
        where: (f, { and, eq }) =>
          and(eq(f.followerId, profile.id), eq(f.creatorId, creator.id)),
      });
      isFollowing = !!followRecord;
    }
  }

  // Resolve avatar
  const avatarUrl = await resolveAvatarUrl(creator.avatarUrl);

  // Resolve thumbnails for content
  const resolvedContent = await Promise.all(
    creatorContent.map(async (item) => {
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
        createdAt: item.createdAt.toISOString(),
      };
    })
  );

  // Resolve playlist covers
  const resolvedPlaylists = await Promise.all(
    creatorPlaylists.map(async (pl) => {
      let coverUrl: string | null = null;
      if (pl.coverImageUrl?.startsWith("r2://")) {
        try {
          coverUrl = await getPresignedReadUrl({
            key: pl.coverImageUrl.slice(5),
            expiresInSeconds: 7 * 24 * 3600,
          });
        } catch { /* non-fatal */ }
      } else {
        coverUrl = pl.coverImageUrl;
      }
      return {
        id: pl.id,
        title: pl.title,
        description: pl.description,
        coverUrl,
        category: pl.category,
        itemCount: pl.items?.length ?? 0,
      };
    })
  );

  const totalViews = resolvedContent.reduce((sum, c) => sum + c.viewCount, 0);
  const isVerified = creator.creatorProfile?.verificationStatus === "verified";

  return (
    <CreatorProfileClient
      creator={{
        id: creator.id,
        handle: creator.handle,
        displayName: creator.displayName,
        bio: creator.bio,
        avatarUrl,
        isVerified,
        joinedAt: creator.createdAt.toISOString(),
      }}
      content={resolvedContent}
      playlists={resolvedPlaylists}
      followerCount={followerCount}
      totalViews={totalViews}
      isFollowing={isFollowing}
      isLoggedIn={!!session}
    />
  );
}
