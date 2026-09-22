import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { role } = await req.json();

  if (role !== "creator" && role !== "fan") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await db.update(profiles)
    .set({ role, updatedAt: new Date() })
    .where(eq(profiles.id, id));

  return NextResponse.json({ ok: true, role });
}
