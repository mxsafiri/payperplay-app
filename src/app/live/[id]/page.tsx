import { db } from "@/db";
import { livestreams, profiles, livestreamAccess } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { resolveAvatarUrl } from "@/lib/avatar";
import { auth } from "@/lib/auth";
import LiveStreamViewer from "@/components/livestream/LiveStreamViewer";
import { headers } from "next/headers";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const stream = await db.query.livestreams.findFirst({
    where: eq(livestreams.id, id),
    with: { creator: { columns: { displayName: true, handle: true } } },
  });

  if (!stream) return { title: "Stream Not Found" };

  return {
    title: `${stream.title} — ${stream.creator.displayName || stream.creator.handle} | PayPerPlay Live`,
    description: stream.description || `Watch ${stream.creator.displayName || stream.creator.handle} live on PayPerPlay`,
  };
}

export default async function LiveStreamPage({ params }: Props) {
  const { id } = await params;

  const stream = await db.query.livestreams.findFirst({
    where: eq(livestreams.id, id),
    with: {
      creator: {
        columns: {
          id: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!stream) notFound();

  const avatarUrl = stream.creator.avatarUrl
    ? await resolveAvatarUrl(stream.creator.avatarUrl)
    : null;

  // Check authentication and access
  let isAuthenticated = false;
  let hasAccess = stream.priceTzs === 0; // Free streams are always accessible

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    isAuthenticated = true;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
      columns: { id: true },
    });

    if (profile) {
      // Creator always has access
      if (profile.id === stream.creatorId) {
        hasAccess = true;
      } else if (stream.priceTzs > 0) {
        // Check for paid access
        const access = await db.query.livestreamAccess.findFirst({
          where: and(
            eq(livestreamAccess.livestreamId, id),
            eq(livestreamAccess.userId, profile.id),
            eq(livestreamAccess.status, "paid")
          ),
        });
        hasAccess = !!access;
      }
    }
  }

  return (
    <LiveStreamViewer
      stream={{
        id: stream.id,
        title: stream.title,
        description: stream.description,
        category: stream.category,
        status: stream.status,
        priceTzs: stream.priceTzs,
        viewerCount: stream.viewerCount || 0,
        cfPlaybackUrl: stream.cfPlaybackUrl,
        cfWebRtcUrl: stream.cfWebRtcUrl,
        startedAt: stream.startedAt?.toISOString() || null,
      }}
      creator={{
        id: stream.creator.id,
        handle: stream.creator.handle,
        displayName: stream.creator.displayName,
        avatarUrl,
      }}
      isAuthenticated={isAuthenticated}
      hasAccess={hasAccess}
    />
  );
}
