import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify an nTZS webhook request using HMAC-SHA256.
 *
 * nTZS sends the signature as: X-Ntzs-Signature: sha256=<hex>
 * Set NTZS_WEBHOOK_SECRET in your environment to enable verification.
 *
 * Returns true if verified, false if rejected.
 * In development with no secret configured, allows through with a warning.
 */
export function verifyNtzsWebhook(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.NTZS_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[webhook] NTZS_WEBHOOK_SECRET not set — rejecting webhook in production");
      return false;
    }
    // Dev only: allow through with warning
    console.warn("[webhook] NTZS_WEBHOOK_SECRET not set — skipping signature check (dev only)");
    return true;
  }

  if (!signatureHeader) {
    console.error("[webhook] Missing X-Ntzs-Signature header");
    return false;
  }

  // Header format: "sha256=<hex>"
  const prefix = "sha256=";
  const receivedHex = signatureHeader.startsWith(prefix)
    ? signatureHeader.slice(prefix.length)
    : signatureHeader;

  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    const received = Buffer.from(receivedHex, "hex");
    const expected = Buffer.from(expectedHex, "hex");
    if (received.length !== expected.length) return false;
    return timingSafeEqual(received, expected);
  } catch {
    return false;
  }
}
