import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logCampaignActivity } from "@/lib/activity-log";
import { deliverNotificationEmails, writeNotifications, type NotifyPayload } from "@/lib/notify";
import { creatorPayoutInPaise, formatPaise } from "@/lib/money";
import { refundRazorpayPayment } from "@/lib/razorpay";

/** Days of brand silence after content is submitted before escrow releases itself. */
export const AUTO_RELEASE_DAYS = 7;
/** Warn the brand on these days before that happens. */
export const AUTO_RELEASE_WARNING_DAYS = [3, 6] as const;

/** Everything needed to move money and tell both sides about it. */
const DEAL_INCLUDE = {
  escrow: true,
  creator: {
    include: { user: { select: { id: true, email: true, emailNotifications: true } } },
  },
  campaign: {
    include: {
      brand: {
        include: { user: { select: { id: true, email: true, emailNotifications: true } } },
      },
    },
  },
} satisfies Prisma.ApplicationInclude;

export type Deal = Prisma.ApplicationGetPayload<{ include: typeof DEAL_INCLUDE }>;

export async function loadDeal(
  applicationId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<Deal | null> {
  return client.application.findUnique({
    where: { id: applicationId },
    include: DEAL_INCLUDE,
  });
}

function creatorRecipient(deal: Deal, notification: Omit<NotifyPayload, "userId" | "email" | "emailEnabled">): NotifyPayload {
  return {
    userId: deal.creator.user.id,
    email: deal.creator.user.email,
    emailEnabled: deal.creator.user.emailNotifications,
    ...notification,
  };
}

function brandRecipient(deal: Deal, notification: Omit<NotifyPayload, "userId" | "email" | "emailEnabled">): NotifyPayload {
  return {
    userId: deal.campaign.brand.user.id,
    email: deal.campaign.brand.user.email,
    emailEnabled: deal.campaign.brand.user.emailNotifications,
    ...notification,
  };
}

/**
 * Marks escrow funded and unblocks the creator. Only ever called from a
 * verified Razorpay webhook — a brand cannot put an application into FUNDED by
 * asking nicely.
 */
export async function fundEscrow(params: {
  orderId: string;
  paymentId: string;
}): Promise<{ funded: boolean; reason?: string }> {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { razorpayOrderId: params.orderId },
  });

  if (!escrow) {
    return { funded: false, reason: `No escrow row for order ${params.orderId}` };
  }
  if (escrow.status !== "PENDING") {
    // Already funded (or beyond) — a retried webhook, nothing to do.
    return { funded: false, reason: `Escrow already ${escrow.status}` };
  }

  const deal = await loadDeal(escrow.applicationId);
  if (!deal) {
    return { funded: false, reason: "Application vanished" };
  }

  const notifications: NotifyPayload[] = [
    creatorRecipient(deal, {
      type: "ESCROW_FUNDED",
      title: "Payment is secured — you can start",
      body: `${deal.campaign.brand.companyName} has funded ${formatPaise(escrow.amount)} into escrow for "${deal.campaign.title}". The money is held by Influnz until your work is approved.`,
      linkUrl: "/dashboard/creator/applications",
    }),
    brandRecipient(deal, {
      type: "ESCROW_FUNDED",
      title: "Escrow funded",
      body: `${formatPaise(escrow.amount)} is now held in escrow for "${deal.campaign.title}" with ${deal.creator.name}. It is released when you approve their content.`,
      linkUrl: `/dashboard/brand/campaigns/${deal.campaignId}`,
    }),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.update({
      where: { id: escrow.id },
      data: {
        status: "FUNDED",
        razorpayPaymentId: params.paymentId,
        fundedAt: new Date(),
      },
    });

    // CONFIRMED is the only state funding can advance; anything else means the
    // deal moved on underneath us and the money should be reconciled by hand.
    if (deal.status === "CONFIRMED") {
      await tx.application.update({ where: { id: deal.id }, data: { status: "FUNDED" } });
    }

    await logCampaignActivity(
      {
        campaignId: deal.campaignId,
        applicationId: deal.id,
        actorId: deal.campaign.brand.user.id,
        actorRole: "BRAND",
        actionType: "ESCROW_FUNDED",
        details: { note: `${formatPaise(escrow.amount)} funded into escrow.` },
      },
      tx,
    );

    await writeNotifications(tx, notifications);
  });

  await deliverNotificationEmails(notifications);
  return { funded: true };
}

/**
 * Releases held money to the creator: on brand approval, on auto-release, or
 * when an admin resolves a dispute in the creator's favour.
 */
export async function releaseEscrow(params: {
  applicationId: string;
  actorId: string;
  actorRole: UserRole;
  note: string;
  /** Partial release, in paise, for a split dispute resolution. */
  releaseAmountPaise?: number;
}): Promise<{ released: boolean; reason?: string }> {
  const deal = await loadDeal(params.applicationId);
  if (!deal?.escrow) {
    return { released: false, reason: "No escrow for this application" };
  }
  if (deal.escrow.status !== "FUNDED" && deal.escrow.status !== "DISPUTED") {
    return { released: false, reason: `Escrow is ${deal.escrow.status}, not releasable` };
  }

  const escrow = deal.escrow;
  const gross = params.releaseAmountPaise ?? escrow.amount;
  const fee = Math.floor((gross * escrow.platformFee) / Math.max(escrow.amount, 1));
  const payout = creatorPayoutInPaise(gross, fee);

  const notifications: NotifyPayload[] = [
    creatorRecipient(deal, {
      type: "ESCROW_RELEASED",
      title: "Payment released",
      body: `${formatPaise(payout)} for "${deal.campaign.title}" has been released and is queued for payout to you.`,
      linkUrl: "/dashboard/creator/applications",
    }),
    brandRecipient(deal, {
      type: "ESCROW_RELEASED",
      title: "Escrow released",
      body: `${formatPaise(gross)} held for "${deal.campaign.title}" has been released to ${deal.creator.name}. ${params.note}`,
      linkUrl: `/dashboard/brand/campaigns/${deal.campaignId}`,
    }),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.update({
      where: { id: escrow.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        releasedAmount: payout,
      },
    });

    if (deal.status === "APPROVED" || deal.status === "CONTENT_SUBMITTED") {
      await tx.application.update({ where: { id: deal.id }, data: { status: "RELEASED" } });
    }

    await logCampaignActivity(
      {
        campaignId: deal.campaignId,
        applicationId: deal.id,
        actorId: params.actorId,
        actorRole: params.actorRole,
        actionType: "ESCROW_RELEASED",
        details: { note: `${formatPaise(payout)} released to creator. ${params.note}` },
      },
      tx,
    );

    await writeNotifications(tx, notifications);
  });

  await deliverNotificationEmails(notifications);
  return { released: true };
}

/**
 * Sends held money back to the brand. The Razorpay call happens before the
 * transaction on purpose: an external side effect cannot be rolled back, so we
 * do it first and then record what happened.
 */
export async function refundEscrow(params: {
  applicationId: string;
  actorId: string;
  actorRole: UserRole;
  note: string;
  /** Partial refund, in paise, for a split dispute resolution. */
  refundAmountPaise?: number;
}): Promise<{ refunded: boolean; reason?: string }> {
  const deal = await loadDeal(params.applicationId);
  if (!deal?.escrow) {
    return { refunded: false, reason: "No escrow for this application" };
  }

  const escrow = deal.escrow;
  if (escrow.status !== "FUNDED" && escrow.status !== "DISPUTED") {
    return { refunded: false, reason: `Escrow is ${escrow.status}, not refundable` };
  }
  if (!escrow.razorpayPaymentId) {
    return { refunded: false, reason: "Escrow has no captured payment to refund" };
  }

  const amount = params.refundAmountPaise ?? escrow.amount;

  const refund = await refundRazorpayPayment({
    paymentId: escrow.razorpayPaymentId,
    amountPaise: amount,
    notes: { applicationId: deal.id, reason: params.note.slice(0, 250) },
  });

  const notifications: NotifyPayload[] = [
    brandRecipient(deal, {
      type: "ESCROW_REFUNDED",
      title: "Escrow refunded",
      body: `${formatPaise(amount)} held for "${deal.campaign.title}" has been refunded to you. ${params.note}`,
      linkUrl: `/dashboard/brand/campaigns/${deal.campaignId}`,
    }),
    creatorRecipient(deal, {
      type: "ESCROW_REFUNDED",
      title: "Escrow returned to the brand",
      body: `The ${formatPaise(amount)} held for "${deal.campaign.title}" has been returned to ${deal.campaign.brand.companyName}. ${params.note}`,
      linkUrl: "/dashboard/creator/applications",
    }),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.update({
      where: { id: escrow.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundedAmount: amount,
        razorpayRefundId: refund.id,
      },
    });

    await logCampaignActivity(
      {
        campaignId: deal.campaignId,
        applicationId: deal.id,
        actorId: params.actorId,
        actorRole: params.actorRole,
        actionType: "ESCROW_REFUNDED",
        details: { note: `${formatPaise(amount)} refunded to brand. ${params.note}` },
      },
      tx,
    );

    await writeNotifications(tx, notifications);
  });

  await deliverNotificationEmails(notifications);
  return { refunded: true };
}

/** Freezes auto-release while an admin looks at a dispute. */
export async function markEscrowDisputed(
  tx: Prisma.TransactionClient,
  escrowId: string,
): Promise<void> {
  await tx.escrowTransaction.update({ where: { id: escrowId }, data: { status: "DISPUTED" } });
}
