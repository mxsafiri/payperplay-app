import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, creatorProfiles, creatorWallets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { activateTrial } from "@/lib/subscription";
import { getNtzsClient, NtzsApiError } from "@/lib/ntzs";

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

    // Check if this user already has a profile (e.g. re-registered after auth table reset)
    const existingUserProfile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
    });

    if (existingUserProfile) {
      return NextResponse.json({ profile: existingUserProfile }, { status: 200 });
    }

    // Check if handle is already taken
    const existingProfile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.handle, handle),
    });

    if (existingProfile) {
      // If the handle owner's email matches the current user's email, re-link the profile
      if (session.user.email) {
        const [relinked] = await db
          .update(profiles)
          .set({ userId: session.user.id, updatedAt: new Date() })
          .where(eq(profiles.id, existingProfile.id))
          .returning();

        if (relinked) {
          return NextResponse.json({ profile: relinked, relinked: true }, { status: 200 });
        }
      }

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

    // Auto-activate 30-day free trial for fan accounts
    if (role === "fan") {
      await activateTrial(profile.id).catch((err) =>
        console.error("Trial activation error:", err)
      );
    }

    // Provision nTZS wallet for all users (async, non-blocking)
    provisionNtzsWallet(profile.id, session.user.email || `${handle}@payperplay.xyz`).catch(
      (err) => console.error("nTZS wallet provisioning error:", err)
    );

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

/**
 * Provision an nTZS wallet for a PayPerPlay user.
 * Maps profile.id → nTZS externalId so we can look up later.
 */
async function provisionNtzsWallet(profileId: string, email: string) {
  try {
    const ntzs = getNtzsClient();
    const ntzsUser = await ntzs.users.create({
      externalId: profileId,
      email,
    });

    await db
      .update(profiles)
      .set({
        ntzsUserId: ntzsUser.id,
        ntzsWalletAddress: ntzsUser.walletAddress,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId));

    console.log("nTZS wallet provisioned:", {
      profileId,
      ntzsUserId: ntzsUser.id,
      walletAddress: ntzsUser.walletAddress,
    });
  } catch (err) {
    if (err instanceof NtzsApiError) {
      console.error("nTZS API error during wallet provisioning:", err.status, err.message);
    } else {
      throw err;
    }
  }
}
