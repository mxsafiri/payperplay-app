import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPresignedReadUrl } from "@/lib/storage/r2";

// POST /api/upload/presign/read — get a presigned read URL for a storage key
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storageKey } = await req.json();

    if (!storageKey) {
      return NextResponse.json({ error: "storageKey is required" }, { status: 400 });
    }

    // Generate a long-lived read URL (7 days for avatars)
    const url = await getPresignedReadUrl({
      key: storageKey,
      expiresInSeconds: 7 * 24 * 3600,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Presign read error:", error);
    return NextResponse.json({ error: "Failed to generate read URL" }, { status: 500 });
  }
}
