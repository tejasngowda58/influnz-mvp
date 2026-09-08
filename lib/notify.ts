import type { Prisma } from "@prisma/client";
import { appUrl, sendEmail } from "@/lib/email";

/**
 * Notifications have two halves with different failure rules:
 *
 * - the in-app row is written *inside* the caller's transaction, so a user is
 *   never told about a state change that rolled back;
 * - the email goes out *after* the transaction commits, best-effort, because a
 *   flaky mail provider must not undo a payment or a status change.
 *
 * Build the payloads before the transaction (you already have the recipients
 * loaded), write them in it, then deliver after it.
 */

export interface NotifyPayload {
  userId: string;
  /** Recipient address, captured up-front so delivery needs no further reads. */
  email: string;
  /** The recipient's own email preference, honoured at delivery time. */
  emailEnabled: boolean;
  type: string;
  title: string;
  body: string;
  /** App-relative path, e.g. `/dashboard/creator/applications`. */
  linkUrl?: string;
}

export async function writeNotifications(
  tx: Prisma.TransactionClient,
  payloads: NotifyPayload[],
): Promise<void> {
  if (payloads.length === 0) return;

  await tx.notification.createMany({
    data: payloads.map((payload) => ({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      linkUrl: payload.linkUrl,
    })),
  });
}

/** Call only after the transaction that wrote the notifications has committed. */
export async function deliverNotificationEmails(payloads: NotifyPayload[]): Promise<void> {
  await Promise.all(
    payloads
      .filter((payload) => payload.emailEnabled && payload.email)
      .map((payload) =>
        sendEmail({
          to: payload.email,
          subject: payload.title,
          heading: payload.title,
          lines: [payload.body],
          actionLabel: payload.linkUrl ? "Open Influnz" : undefined,
          actionUrl: payload.linkUrl ? appUrl(payload.linkUrl) : undefined,
        }),
      ),
  );
}
