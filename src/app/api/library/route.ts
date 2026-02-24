import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveAvatarUrl } from "@/lib/avatar";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get user's entitlements with content details
    const entitlements = await db.query.entitlements.findMany({
      where: (entitlements, { eq }) => eq(entitlements.userId, profile.id),
      with: {
        content: {
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
        },
      },
      orderBy: (entitlements, { desc }) => [desc(entitlements.grantedAt)],
    });

    // Transform to library format and resolve avatar URLs
    const library = await Promise.all(
      entitlements
        .filter((e) => e.content)
        .map(async (e) => ({
          id: e.content!.id,
          title: e.content!.title,
          category: e.content!.category,
          priceTzs: e.content!.priceTzs,
          creator: {
            ...e.content!.creator,
            avatarUrl: await resolveAvatarUrl(e.content!.creator?.avatarUrl),
          },
          grantedAt: e.grantedAt,
        }))
    );

    return NextResponse.json({ content: library });
  } catch (error) {
    console.error("Library fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    );
  }
}
