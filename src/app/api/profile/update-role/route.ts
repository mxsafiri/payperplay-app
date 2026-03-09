import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, creatorProfiles, creatorWallets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newRole } = await req.json();

    if (newRole !== "creator" && newRole !== "fan") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get current profile
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.role === newRole) {
      return NextResponse.json({ message: "Role unchanged", profile }, { status: 200 });
    }

    // Update role
    const [updated] = await db
      .update(profiles)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id))
      .returning();

    // If upgrading to creator, create creator profile + wallet
    if (newRole === "creator" && profile.role === "fan") {
      const existingCreatorProfile = await db.query.creatorProfiles.findFirst({
        where: (cp, { eq }) => eq(cp.profileId, profile.id),
      });

      if (!existingCreatorProfile) {
        await db.insert(creatorProfiles).values({ profileId: profile.id });
        await db.insert(creatorWallets).values({ creatorId: profile.id });
      }
    }

    return NextResponse.json({ profile: updated }, { status: 200 });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
