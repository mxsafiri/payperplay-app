import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getNtzsClient, NtzsApiError } from "@/lib/ntzs";

/**
 * Ensure a user has an nTZS wallet. If they don't have one yet
 * (e.g. existing users before the integration), provision one now.
 * Returns the ntzsUserId or null if provisioning fails.
 */
export async function ensureNtzsWallet(profileId: string): Promise<string | null> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
  });

  if (!profile) return null;

  // Already provisioned
  if (profile.ntzsUserId) return profile.ntzsUserId;

  // Lazy-provision for existing users
  try {
    const ntzs = getNtzsClient();
    const ntzsUser = await ntzs.users.create({
      externalId: profileId,
      email: `${profile.handle}@payperplay.xyz`,
    });

    await db
      .update(profiles)
      .set({
        ntzsUserId: ntzsUser.id,
        ntzsWalletAddress: ntzsUser.walletAddress,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId));

    console.log("nTZS wallet lazy-provisioned for existing user:", {
      profileId,
      ntzsUserId: ntzsUser.id,
    });

    return ntzsUser.id;
  } catch (err) {
    if (err instanceof NtzsApiError) {
      console.error("nTZS lazy-provision error:", err.status, err.message);
    } else {
      console.error("nTZS lazy-provision error:", err);
    }
    return null;
  }
}
