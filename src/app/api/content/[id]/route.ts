import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { resolveAvatarUrl } from "@/lib/avatar";
import { getPresignedReadUrl } from "@/lib/storage/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get content with creator and media
    const contentItem = await db.query.content.findFirst({
      where: eq(content.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        media: {
          columns: {
            id: true,
            mediaType: true,
            url: true,
            storageKey: true,
          },
        },
      },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Check if user has access
    let hasAccess = false;

    // Free content is accessible to everyone
    if (contentItem.priceTzs === 0) {
      hasAccess = true;
    } else {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (session) {
        const profile = await db.query.profiles.findFirst({
          where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
        });

        if (profile) {
          // Check if user is the creator
          if (profile.id === contentItem.creatorId) {
            hasAccess = true;
          } else {
            // Check for entitlement
            const entitlement = await db.query.entitlements.findFirst({
              where: (entitlements, { and, eq }) =>
                and(
                  eq(entitlements.userId, profile.id),
                  eq(entitlements.contentId, id)
                ),
            });
            hasAccess = !!entitlement;
          }
        }
      }
    }

    // Resolve R2 thumbnail storageKeys → presigned URLs
    const resolvedMedia = await Promise.all(
      (contentItem.media || []).map(async (m: any) => {
        if (m.mediaType === "thumbnail" && m.storageKey && !m.url) {
          try {
            const url = await getPresignedReadUrl({ key: m.storageKey, expiresInSeconds: 7 * 24 * 3600 });
            return { ...m, url };
          } catch {
            return m;
          }
        }
        return m;
      })
    );

    return NextResponse.json({
      ...contentItem,
      media: resolvedMedia,
      creator: {
        ...contentItem.creator,
        avatarUrl: await resolveAvatarUrl(contentItem.creator?.avatarUrl),
      },
      hasAccess,
    });
  } catch (error) {
    console.error("Content detail fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
