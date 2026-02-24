/**
 * Migration: Convert old presigned avatar URLs to r2://key format
 * so they can be resolved to fresh presigned URLs on every request.
 *
 * Old format examples:
 *   https://{account}.r2.cloudflarestorage.com/{bucket}/avatars/{profileId}/{filename}?X-Amz-...
 *   (any presigned URL containing /avatars/ in the path)
 *
 * New format:
 *   r2://avatars/{profileId}/{filename}
 */
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Fetching profiles with avatar URLs...");

  const rows = await sql`
    SELECT id, handle, avatar_url FROM profiles WHERE avatar_url IS NOT NULL
  `;

  console.log(`Found ${rows.length} profiles with avatar URLs`);

  let fixed = 0;
  let alreadyOk = 0;
  let skipped = 0;

  for (const row of rows) {
    const url = row.avatar_url;

    // Already in r2:// format — skip
    if (url.startsWith("r2://")) {
      alreadyOk++;
      continue;
    }

    // Try to extract key from presigned URL
    // URL format: https://{account}.r2.cloudflarestorage.com/{bucket}/{key}?X-Amz-...
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split("/").filter(Boolean);

      // Path is /{bucket}/{key...} — skip bucket name (first segment)
      if (pathParts.length >= 2) {
        // Check if path contains 'avatars' anywhere
        const avatarIdx = pathParts.indexOf("avatars");
        let key;

        if (avatarIdx >= 0) {
          // Key starts from 'avatars' onward
          key = pathParts.slice(avatarIdx).join("/");
        } else {
          // Fallback: skip first segment (bucket name) and use the rest
          key = pathParts.slice(1).join("/");
        }

        if (key) {
          const newUrl = `r2://${key}`;
          console.log(`  [${row.handle}] ${url.slice(0, 80)}... → ${newUrl}`);
          await sql`UPDATE profiles SET avatar_url = ${newUrl} WHERE id = ${row.id}`;
          fixed++;
          continue;
        }
      }
    } catch {
      // Not a valid URL — skip
    }

    console.log(`  [${row.handle}] SKIPPED — unrecognized format: ${url.slice(0, 80)}`);
    skipped++;
  }

  console.log(`\nDone! Fixed: ${fixed}, Already OK: ${alreadyOk}, Skipped: ${skipped}`);
}

main().catch(console.error);
