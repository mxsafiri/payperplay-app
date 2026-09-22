import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { content } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await db.update(content)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(content.id, id));

  return NextResponse.json({ ok: true });
}
