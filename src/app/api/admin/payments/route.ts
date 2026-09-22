import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentIntents, profiles, content } from "@/db/schema";
import { checkAdminHeader } from "@/lib/admin-auth";
import { eq, desc, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!checkAdminHeader(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: paymentIntents.id,
      amountTzs: paymentIntents.amountTzs,
      status: paymentIntents.status,
      provider: paymentIntents.provider,
      phoneNumber: paymentIntents.phoneNumber,
      providerReference: paymentIntents.providerReference,
      createdAt: paymentIntents.createdAt,
      paidAt: paymentIntents.paidAt,
      contentTitle: content.title,
      contentId: content.id,
      userHandle: profiles.handle,
      userId: profiles.id,
    })
    .from(paymentIntents)
    .innerJoin(profiles, eq(profiles.id, paymentIntents.userId))
    .innerJoin(content, eq(content.id, paymentIntents.contentId))
    .where(status ? eq(paymentIntents.status, status as "pending" | "paid" | "failed" | "refunded") : undefined)
    .orderBy(desc(paymentIntents.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ payments: rows, page, limit });
}
