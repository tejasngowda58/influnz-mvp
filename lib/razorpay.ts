import crypto from "node:crypto";

/**
 * Thin Razorpay REST client. Deliberately not the `razorpay` npm package: we
 * only need three calls and HMAC verification, and fetch plus node:crypto do
 * that without another dependency in the payment path.
 */

const RAZORPAY_API = "https://api.razorpay.com/v1";

interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

function credentials(): RazorpayCredentials {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to take payments");
  }

  return { keyId, keySecret };
}

/** Whether payments can run at all — used to keep escrow UI honest in dev. */
export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET,
  );
}

/** The publishable key. Safe to hand to the browser; the secret never leaves the server. */
export function razorpayPublicKey(): string {
  return credentials().keyId;
}

async function razorpayRequest<T>(path: string, body: unknown): Promise<T> {
  const { keyId, keySecret } = credentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`${RAZORPAY_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    // Razorpay puts a useful message in error.description; keep it server-side only.
    throw new Error(`Razorpay ${path} failed (${response.status}): ${text}`);
  }

  return JSON.parse(text) as T;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  return razorpayRequest<RazorpayOrder>("/orders", {
    amount: params.amountPaise,
    currency: params.currency ?? "INR",
    receipt: params.receipt,
    notes: params.notes ?? {},
    // Escrow must capture immediately; an authorised-but-uncaptured payment
    // would leave the creator working against money we do not hold.
    payment_capture: 1,
  });
}

export interface RazorpayRefund {
  id: string;
  amount: number;
  status: string;
}

export async function refundRazorpayPayment(params: {
  paymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}): Promise<RazorpayRefund> {
  return razorpayRequest<RazorpayRefund>(`/payments/${params.paymentId}/refund`, {
    amount: params.amountPaise,
    notes: params.notes ?? {},
  });
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

/**
 * Verifies a webhook came from Razorpay. Must be given the *raw* request body:
 * re-serialising parsed JSON changes the bytes and the signature will not match.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/**
 * Verifies the signature Razorpay Checkout hands back in the browser. This is a
 * convenience signal only — escrow is funded by the webhook, which is the
 * server-to-server source of truth.
 */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = credentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return safeEqualHex(expected, params.signature);
}
