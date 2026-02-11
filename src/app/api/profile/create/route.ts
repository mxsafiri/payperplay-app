import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, creatorProfiles, creatorWallets } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { handle, role, displayName } = await req.json();

    // Validate input
    if (!handle || !role) {
      return NextResponse.json(
        { error: "Handle and role are required" },
        { status: 400 }
      );
    }

    if (role !== "creator" && role !== "fan") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if handle is already taken
    const existingProfile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.handle, handle),
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Handle already taken" },
        { status: 409 }
      );
    }

    // Create profile
    const [profile] = await db
      .insert(profiles)
      .values({
        userId: session.user.id,
        role,
        handle,
        displayName: displayName || session.user.name,
      })
      .returning();

    // If creator, create creator profile + wallet
    if (role === "creator") {
      await db.insert(creatorProfiles).values({
        profileId: profile.id,
      });
      await db.insert(creatorWallets).values({
        creatorId: profile.id,
      });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
