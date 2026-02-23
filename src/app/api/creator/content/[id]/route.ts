import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content, comments } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!profile || profile.role !== "creator") {
      return NextResponse.json(
        { error: "Not a creator" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const contentItem = await db.query.content.findFirst({
      where: and(eq(content.id, id), eq(content.creatorId, profile.id)),
      with: {
        media: true,
        comments: {
          with: {
            user: {
              columns: { id: true, handle: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
      },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ content: contentItem });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// PUT /api/creator/content/[id] — update content metadata
export async function PUT(
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

    const { id } = await params;
    const body = await req.json();
    const { title, description, category, priceTzs, status } = body;

    // Validate price if provided
    if (priceTzs !== undefined) {
      const price = Number(priceTzs);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      if (price > 0 && price < 500) {
        return NextResponse.json({ error: "Minimum price is 500 TZS" }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status !== undefined && !["draft", "published"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priceTzs !== undefined) updateData.priceTzs = Number(priceTzs);
    if (status !== undefined) {
      updateData.status = status;
      if (status === "published") updateData.publishedAt = new Date();
    }

    const [updated] = await db
      .update(content)
      .set(updateData)
      .where(and(eq(content.id, id), eq(content.creatorId, profile.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ content: updated });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

// DELETE /api/creator/content/[id] — delete content
export async function DELETE(
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

    const { id } = await params;

    const [deleted] = await db
      .delete(content)
      .where(and(eq(content.id, id), eq(content.creatorId, profile.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content delete error:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
