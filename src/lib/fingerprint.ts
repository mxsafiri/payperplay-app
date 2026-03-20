/**
 * Device fingerprinting for view-once link protection.
 * Ties a guest purchase to a specific device so shared links don't work.
 */

/**
 * Server-side: hash a fingerprint string into a SHA-256 hex digest.
 */
export async function hashFingerprint(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Server-side: validate that a provided fingerprint matches the stored one.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function fingerprintsMatch(stored: string, provided: string): boolean {
  if (stored.length !== provided.length) return false;
  let mismatch = 0;
  for (let i = 0; i < stored.length; i++) {
    mismatch |= stored.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Client-side helper: collect device signals and produce a raw fingerprint string.
 * This runs in the browser and sends the result to the server for hashing.
 */
export function collectDeviceSignals(linkSlug: string): string {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lang = navigator.language;
  return `${ua}|${screen}|${tz}|${lang}|${linkSlug}`;
}
