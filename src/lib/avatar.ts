import { getPresignedReadUrl } from "@/lib/storage/r2";

/**
 * Resolve an avatar URL stored in the DB.
 * - `r2://key` → generate a fresh presigned read URL (7 days)
 * - Regular URL → return as-is (legacy, may be expired)
 * - null → null
 */
export async function resolveAvatarUrl(
  avatarUrl: string | null | undefined
): Promise<string | null> {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("r2://")) {
    const key = avatarUrl.slice(5);
    try {
      return await getPresignedReadUrl({ key, expiresInSeconds: 7 * 24 * 3600 });
    } catch {
      return null;
    }
  }
  return avatarUrl;
}
