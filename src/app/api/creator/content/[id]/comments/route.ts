import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content, comments } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

// POST /api/creator/content/[id]/comments — creator replies to a comment thread
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 });
    }

    const { id: contentId } = await params;

    // Verify content belongs to creator
    const contentItem = await db.query.content.findFirst({
      where: and(eq(content.id, contentId), eq(content.creatorId, profile.id)),
    });

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const { body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
    }

    const [comment] = await db
      .insert(comments)
      .values({
        userId: profile.id,
        contentId,
        body: body.trim(),
      })
      .returning();

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Creator comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
