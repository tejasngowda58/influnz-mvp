import { createHmac, timingSafeEqual } from "crypto";

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

/**
 * Verifies and decodes a Meta "signed_request" payload (used by the
 * deauthorize and data-deletion webhook callbacks).
 * Returns null if the signature doesn't match the app secret.
 */
export function parseSignedRequest(signedRequest: string, appSecret: string): Record<string, unknown> | null {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) {
    return null;
  }

  const expectedSig = createHmac("sha256", appSecret).update(payload).digest();
  const actualSig = base64UrlDecode(encodedSig);

  if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
    return null;
  }

  return JSON.parse(base64UrlDecode(payload).toString("utf8"));
}
