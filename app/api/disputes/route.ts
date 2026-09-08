import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logCampaignActivity } from "@/lib/activity-log";
import { markEscrowDisputed } from "@/lib/escrow";
import { formatPaise } from "@/lib/money";
import { deliverNotificationEmails, writeNotifications, type NotifyPayload } from "@/lib/notify";

interface RaiseDisputeBody {
  applicationId?: string;
  reason?: string;
  description?: string;
  evidence?: string[];
}

/**
 * Either party can dispute a funded deal. Raising one freezes the money: escrow
 * moves to DISPUTED, which takes it out of auto-release until an admin decides.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "BRAND" && session.user.role !== "CREATOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  const userId = session.user.id;

  let body: RaiseDisputeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { applicationId, reason, description } = body;
  if (!applicationId || !reason?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "applicationId, reason, and description are all required" },
      { status: 400 },
    );
  }

  const PARTY_USER = { select: { id: true, email: true, emailNotifications: true } } as const;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      escrow: true,
      disputes: true,
      creator: { include: { user: PARTY_USER } },
      campaign: { include: { brand: { include: { user: PARTY_USER } } } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const isBrandParty = application.campaign.brand.userId === userId;
  const isCreatorParty = application.creator.userId === userId;
  if (!isBrandParty && !isCreatorParty) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (!application.escrow) {
    return NextResponse.json(
      { error: "There's nothing to dispute until escrow is funded." },
      { status: 409 },
    );
  }
  if (application.escrow.status !== "FUNDED" && application.escrow.status !== "DISPUTED") {
    return NextResponse.json(
      { error: `Escrow is ${application.escrow.status} — disputes are only open while money is held.` },
      { status: 409 },
    );
  }

  const alreadyOpen = application.disputes.some(
    (dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW",
  );
  if (alreadyOpen) {
    return NextResponse.json(
      { error: "There's already an open dispute on this deal." },
      { status: 409 },
    );
  }

  const evidence = (body.evidence ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);

  const raisedByName = isBrandParty
    ? application.campaign.brand.companyName
    : application.creator.name;

  const otherParty: Pick<NotifyPayload, "userId" | "email" | "emailEnabled"> = isBrandParty
    ? {
        userId: application.creator.user.id,
        email: application.creator.user.email,
        emailEnabled: application.creator.user.emailNotifications,
      }
    : {
        userId: application.campaign.brand.user.id,
        email: application.campaign.brand.user.email,
        emailEnabled: application.campaign.brand.user.emailNotifications,
      };

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, emailNotifications: true },
  });

  const notifications: NotifyPayload[] = [
    {
      ...otherParty,
      type: "DISPUTE_RAISED",
      title: "A dispute was raised on your deal",
      body: `${raisedByName} raised a dispute on "${application.campaign.title}": ${reason.trim()}. The ${formatPaise(application.escrow.amount)} in escrow is frozen until an admin reviews it.`,
      linkUrl: isBrandParty
        ? "/dashboard/creator/applications"
        : `/dashboard/brand/campaigns/${application.campaignId}`,
    },
    ...admins.map((admin) => ({
      userId: admin.id,
      email: admin.email,
      emailEnabled: admin.emailNotifications,
      type: "DISPUTE_RAISED",
      title: "Dispute needs review",
      body: `${raisedByName} disputed "${application.campaign.title}" (${formatPaise(application.escrow!.amount)} held): ${reason.trim()}`,
      linkUrl: "/dashboard/admin/disputes",
    })),
  ];

  const dispute = await prisma.$transaction(async (tx) => {
    const created = await tx.dispute.create({
      data: {
        applicationId: application.id,
        raisedById: userId,
        raisedByRole: role,
        reason: reason.trim(),
        description: description.trim(),
        evidence,
      },
    });

    await markEscrowDisputed(tx, application.escrow!.id);

    await logCampaignActivity(
      {
        campaignId: application.campaignId,
        applicationId: application.id,
        actorId: userId,
        actorRole: role,
        actionType: "DISPUTE_RAISED",
        details: { note: `${reason.trim()} — ${description.trim()}` },
      },
      tx,
    );

    await writeNotifications(tx, notifications);

    return created;
  });

  await deliverNotificationEmails(notifications);
  return NextResponse.json({ dispute }, { status: 201 });
}
