import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { comments, content, profiles } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { resolveAvatarUrl } from "@/lib/avatar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      handle: profiles.handle,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(comments)
    .innerJoin(profiles, eq(profiles.id, comments.userId))
    .where(eq(comments.contentId, id))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  const resolved = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      user: {
        handle: r.handle,
        displayName: r.displayName,
        avatarUrl: await resolveAvatarUrl(r.avatarUrl),
      },
    }))
  );

  return NextResponse.json(resolved);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  if (body.trim().length > 500) return NextResponse.json({ error: "Comment too long (max 500 chars)" }, { status: 400 });

  const profile = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.userId, session.user.id),
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const [comment] = await db
    .insert(comments)
    .values({ userId: profile.id, contentId: id, body: body.trim() })
    .returning();

  await db
    .update(content)
    .set({ commentCount: sql`coalesce(${content.commentCount}, 0) + 1` })
    .where(eq(content.id, id));

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    user: {
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: await resolveAvatarUrl(profile.avatarUrl),
    },
  });
}
