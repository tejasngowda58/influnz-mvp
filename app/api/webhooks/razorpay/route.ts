import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fundEscrow } from "@/lib/escrow";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay's server-to-server truth about payments. This is the only thing that
 * can put escrow into FUNDED.
 *
 * Two rules hold this together:
 *  1. the signature is verified against the *raw* body before anything is read;
 *  2. every event id is inserted into WebhookEvent first, and the unique index
 *     on (provider, eventId) makes a retried delivery a no-op instead of a
 *     second state change. Razorpay retries, so this is not optional.
 *
 * Deliberately unauthenticated (and excluded from `proxy.ts`): the caller is
 * Razorpay, not a signed-in user. The signature is the auth.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      refund?: { entity?: { id?: string; payment_id?: string } };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = event.event ?? "unknown";
  // Razorpay sends a delivery id per event; fall back to the payment id so we
  // still de-duplicate if the header is ever absent.
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    event.payload?.payment?.entity?.id ??
    event.payload?.refund?.entity?.id;

  if (!eventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "razorpay",
        eventId,
        eventType,
        payload: JSON.parse(rawBody) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Already handled this delivery. Acknowledge so Razorpay stops retrying.
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw error;
  }

  try {
    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        const paymentId = event.payload?.payment?.entity?.id;
        const orderId = event.payload?.payment?.entity?.order_id;

        if (!paymentId || !orderId) {
          console.error(`[razorpay] ${eventType} without payment/order id`, eventId);
          break;
        }

        const result = await fundEscrow({ orderId, paymentId });
        if (!result.funded) {
          console.info(`[razorpay] ${eventType} not applied: ${result.reason}`);
        }
        break;
      }

      case "refund.processed":
        // Refunds are initiated by us and recorded at that point; this arrives
        // as confirmation. Logged for the trail, no state change needed.
        console.info(`[razorpay] refund processed`, event.payload?.refund?.entity?.id);
        break;

      default:
        // Unsubscribed event types are fine to ignore; the row is kept anyway.
        break;
    }
  } catch (error) {
    // The event is recorded, so returning 500 would make Razorpay retry a
    // delivery we would then treat as a duplicate. Log loudly instead.
    console.error(`[razorpay] handler failed for ${eventType} (${eventId})`, error);
    return NextResponse.json({ ok: false, error: "Handler failed" }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
