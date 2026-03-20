/**
 * PATCH /api/view-once/[slug]/watched — Mark content as watched.
 * Soft enforcement — the 4h hard expiry is the real gate.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestPurchases, viewOnceLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

const GUEST_COOKIE_NAME = "pp_guest_session";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const purchaseId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    if (!purchaseId) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const link = await db.query.viewOnceLinks.findFirst({
      where: eq(viewOnceLinks.slug, slug),
    });

    if (!link) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .update(guestPurchases)
      .set({ watched: true, updatedAt: new Date() })
      .where(
        and(
          eq(guestPurchases.id, purchaseId),
          eq(guestPurchases.viewOnceLinkId, link.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark watched error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
