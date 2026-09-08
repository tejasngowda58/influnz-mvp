import { NextResponse } from "next/server";
import type { ActivityActionType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logCampaignActivity } from "@/lib/activity-log";
import { deliverNotificationEmails, writeNotifications, type NotifyPayload } from "@/lib/notify";

type ReviewAction = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

const RESULT_STATUS: Record<ReviewAction, "APPROVED" | "CHANGES_REQUESTED" | "REJECTED"> = {
  APPROVE: "APPROVED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  REJECT: "REJECTED",
};

const RESULT_ACTIVITY: Record<ReviewAction, ActivityActionType> = {
  APPROVE: "ADMIN_APPROVED",
  REQUEST_CHANGES: "ADMIN_REQUESTED_CHANGES",
  REJECT: "ADMIN_REJECTED",
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { action?: ReviewAction; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action || !(body.action in RESULT_STATUS)) {
    return NextResponse.json(
      { error: "action must be one of APPROVE, REQUEST_CHANGES, REJECT" },
      { status: 400 },
    );
  }

  if (body.action !== "APPROVE" && !body.comment?.trim()) {
    return NextResponse.json(
      { error: "A comment is required when requesting changes or rejecting" },
      { status: 400 },
    );
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: { include: { user: { select: { id: true, email: true, emailNotifications: true } } } },
    },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "PENDING_REVIEW") {
    return NextResponse.json({ error: "This campaign isn't awaiting review" }, { status: 409 });
  }

  const action = body.action;
  const comment = body.comment?.trim() || null;

  const DECISION_COPY: Record<ReviewAction, { title: string; body: string }> = {
    APPROVE: {
      title: "Campaign approved",
      body: `"${campaign.title}" is live and creators can now apply.`,
    },
    REQUEST_CHANGES: {
      title: "Changes requested on your campaign",
      body: `An admin asked for changes to "${campaign.title}"${comment ? `: ${comment}` : "."} Edit and resubmit to go live.`,
    },
    REJECT: {
      title: "Campaign rejected",
      body: `"${campaign.title}" was not approved${comment ? `: ${comment}` : "."}`,
    },
  };

  const notification: NotifyPayload = {
    userId: campaign.brand.user.id,
    email: campaign.brand.user.email,
    emailEnabled: campaign.brand.user.emailNotifications,
    type: `CAMPAIGN_${action}`,
    title: DECISION_COPY[action].title,
    body: DECISION_COPY[action].body,
    linkUrl: `/dashboard/brand/campaigns/${campaign.id}`,
  };

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.campaign.update({
      where: { id },
      data: {
        status: RESULT_STATUS[action],
        adminComment: comment,
        reviewedAt: new Date(),
      },
    });

    await logCampaignActivity(
      {
        campaignId: id,
        actorId: session.user.id,
        actorRole: "ADMIN",
        actionType: RESULT_ACTIVITY[action],
        details: comment ? { note: comment } : undefined,
      },
      tx,
    );

    await writeNotifications(tx, [notification]);

    return result;
  });

  await deliverNotificationEmails([notification]);
  return NextResponse.json({ campaign: updated });
}
