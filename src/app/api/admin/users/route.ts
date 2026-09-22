import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, authUser } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq, ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: profiles.id,
      handle: profiles.handle,
      displayName: profiles.displayName,
      role: profiles.role,
      isSuspended: profiles.isSuspended,
      createdAt: profiles.createdAt,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
    })
    .from(profiles)
    .innerJoin(authUser, eq(authUser.id, profiles.userId))
    .where(
      q
        ? or(
            ilike(profiles.handle, `%${q}%`),
            ilike(profiles.displayName, `%${q}%`),
            ilike(authUser.email, `%${q}%`)
          )
        : role
        ? eq(profiles.role, role as "creator" | "fan")
        : undefined
    )
    .orderBy(desc(profiles.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ users: rows, page, limit });
}
