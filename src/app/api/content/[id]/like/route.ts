import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { likes, content } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const contentRow = await db.query.content.findFirst({
    where: (c, { eq }) => eq(c.id, id),
    columns: { likeCount: true },
  });
  if (!contentRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let isLiked = false;
  if (session) {
    const profile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
      columns: { id: true },
    });
    if (profile) {
      const like = await db.query.likes.findFirst({
        where: (l, { and, eq }) => and(eq(l.userId, profile.id), eq(l.contentId, id)),
        columns: { id: true },
      });
      isLiked = !!like;
    }
  }

  return NextResponse.json({ likeCount: contentRow.likeCount ?? 0, isLiked });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.userId, session.user.id),
    columns: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const existing = await db.query.likes.findFirst({
    where: (l, { and, eq }) => and(eq(l.userId, profile.id), eq(l.contentId, id)),
    columns: { id: true },
  });

  if (existing) {
    await db.delete(likes).where(and(eq(likes.userId, profile.id), eq(likes.contentId, id)));
    await db
      .update(content)
      .set({ likeCount: sql`greatest(${content.likeCount} - 1, 0)` })
      .where(eq(content.id, id));
    return NextResponse.json({ isLiked: false });
  } else {
    await db.insert(likes).values({ userId: profile.id, contentId: id });
    await db
      .update(content)
      .set({ likeCount: sql`coalesce(${content.likeCount}, 0) + 1` })
      .where(eq(content.id, id));
    return NextResponse.json({ isLiked: true });
  }
}
