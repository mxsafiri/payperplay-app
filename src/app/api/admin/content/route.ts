import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content, profiles } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq, ilike, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: content.id,
      title: content.title,
      category: content.category,
      status: content.status,
      contentType: content.contentType,
      priceTzs: content.priceTzs,
      viewCount: content.viewCount,
      createdAt: content.createdAt,
      creatorHandle: profiles.handle,
      creatorDisplayName: profiles.displayName,
      creatorId: profiles.id,
    })
    .from(content)
    .innerJoin(profiles, eq(profiles.id, content.creatorId))
    .where(
      q
        ? ilike(content.title, `%${q}%`)
        : status
        ? eq(content.status, status as "draft" | "published" | "archived")
        : undefined
    )
    .orderBy(desc(content.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ content: rows, page, limit });
}
