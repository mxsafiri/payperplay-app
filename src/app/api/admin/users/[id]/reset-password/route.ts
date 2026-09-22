import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, authUser } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const profile = await db
    .select({ email: authUser.email })
    .from(profiles)
    .innerJoin(authUser, eq(authUser.id, profiles.userId))
    .where(eq(profiles.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Trigger Better Auth forget-password flow (sends reset email)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${appUrl}/api/auth/forget-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: profile.email, redirectTo: `${appUrl}/reset-password` }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: profile.email });
}
