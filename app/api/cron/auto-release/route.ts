import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  AUTO_RELEASE_DAYS,
  AUTO_RELEASE_WARNING_DAYS,
  releaseEscrow,
} from "@/lib/escrow";
import { formatPaise } from "@/lib/money";
import { deliverNotificationEmails, writeNotifications, type NotifyPayload } from "@/lib/notify";

/**
 * Auto-release: the answer to "the creator delivered and the brand went quiet".
 *
 * A brand that never responds after content is submitted does not get to sit on
 * the creator's money indefinitely. Warnings go out first, then the money
 * releases on its own. An open dispute freezes all of this.
 *
 * Schedule this at any interval up to daily (Vercel Cron, GitHub Actions, or
 * cron-job.org) with an `Authorization: Bearer $CRON_SECRET` header. It is
 * idempotent: escrow that is already released is skipped, and each warning is
 * counted so it is only sent once.
 */

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const PARTY_USER = { select: { id: true, email: true, emailNotifications: true } } as const;

  // Candidates: funded, content delivered, brand silent, nothing disputed.
  const pending = await prisma.escrowTransaction.findMany({
    where: {
      status: "FUNDED",
      application: {
        status: "CONTENT_SUBMITTED",
        contentSubmittedAt: { not: null },
        disputes: { none: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
      },
    },
    include: {
      application: {
        include: {
          creator: { select: { name: true } },
          campaign: {
            include: { brand: { include: { user: PARTY_USER } } },
          },
        },
      },
    },
  });

  const released: string[] = [];
  const warned: string[] = [];
  const warningNotifications: NotifyPayload[] = [];

  for (const escrow of pending) {
    const submittedAt = escrow.application.contentSubmittedAt;
    if (!submittedAt) continue;

    const elapsedDays = (Date.now() - submittedAt.getTime()) / (24 * 60 * 60 * 1000);

    if (elapsedDays >= AUTO_RELEASE_DAYS) {
      const result = await releaseEscrow({
        applicationId: escrow.applicationId,
        // The activity log needs a real user; the brand is the party whose
        // inaction triggered this, and the note makes the cause explicit.
        actorId: escrow.application.campaign.brand.user.id,
        actorRole: "BRAND",
        note: `Auto-released after ${AUTO_RELEASE_DAYS} days without a decision on submitted content.`,
      });

      if (result.released) {
        released.push(escrow.applicationId);
      } else {
        console.info(`[auto-release] skipped ${escrow.applicationId}: ${result.reason}`);
      }
      continue;
    }

    // Warn at each threshold, once. `autoReleaseWarningsSent` is the counter,
    // so a cron that runs hourly does not spam.
    const dueWarnings = AUTO_RELEASE_WARNING_DAYS.filter((day) => elapsedDays >= day).length;
    if (dueWarnings > escrow.autoReleaseWarningsSent) {
      const daysLeft = Math.max(1, Math.ceil(AUTO_RELEASE_DAYS - elapsedDays));
      const brandUser = escrow.application.campaign.brand.user;

      warningNotifications.push({
        userId: brandUser.id,
        email: brandUser.email,
        emailEnabled: brandUser.emailNotifications,
        type: "AUTO_RELEASE_WARNING",
        title: `Review ${escrow.application.creator.name}'s content within ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        body: `${escrow.application.creator.name} submitted content for "${escrow.application.campaign.title}". If you don't approve or dispute it, the ${formatPaise(escrow.amount)} in escrow releases automatically in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        linkUrl: `/dashboard/brand/campaigns/${escrow.application.campaignId}`,
      });

      await prisma.escrowTransaction.update({
        where: { id: escrow.id },
        data: { autoReleaseWarningsSent: dueWarnings },
      });
      warned.push(escrow.applicationId);
    }
  }

  if (warningNotifications.length > 0) {
    await prisma.$transaction(async (tx) => writeNotifications(tx, warningNotifications));
    await deliverNotificationEmails(warningNotifications);
  }

  return NextResponse.json({
    checked: pending.length,
    released: released.length,
    warned: warned.length,
  });
}
