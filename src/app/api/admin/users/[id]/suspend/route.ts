import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { suspend } = await req.json();

  await db.update(profiles)
    .set({ isSuspended: !!suspend, updatedAt: new Date() })
    .where(eq(profiles.id, id));

  return NextResponse.json({ ok: true, isSuspended: !!suspend });
}
