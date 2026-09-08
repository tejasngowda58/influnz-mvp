import { NextResponse } from "next/server";
import type { ApplicationStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_TRANSITIONS,
  NEGOTIATION_ACTIONS,
  NEGOTIATION_TURN,
  nextStatusForAction,
  type NegotiationAction,
} from "@/lib/application-status";
import { logCampaignActivity } from "@/lib/activity-log";
import { formatBudget } from "@/lib/format";
import { AUTO_RELEASE_DAYS, releaseEscrow } from "@/lib/escrow";
import { deliverNotificationEmails, writeNotifications, type NotifyPayload } from "@/lib/notify";

interface PatchApplicationBody {
  action?: NegotiationAction;
  proposedBudget?: number;
  proposedDeliverables?: string;
  negotiationMessage?: string;
  status?: ApplicationStatus;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "BRAND" && session.user.role !== "CREATOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  const userId = session.user.id;

  const { id } = await params;

  let body: PatchApplicationBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const PARTY_USER = { select: { id: true, email: true, emailNotifications: true } } as const;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      campaign: { include: { brand: { include: { user: PARTY_USER } } } },
      creator: { include: { user: PARTY_USER } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const isBrandOwner = application.campaign.brand.userId === userId;
  const isCreatorOwner = application.creator.userId === userId;

  if (role === "BRAND" && !isBrandOwner) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (role === "CREATOR" && !isCreatorOwner) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  /** The other side of this deal — whoever did not make the current request. */
  const counterparty: Pick<NotifyPayload, "userId" | "email" | "emailEnabled"> =
    role === "BRAND"
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

  // Negotiation actions: Accept / Counter / Decline, turn-based.
  if (body.action) {
    const turn = NEGOTIATION_TURN[application.status];
    if (!turn || turn !== role) {
      return NextResponse.json({ error: "It's not your turn on this application" }, { status: 409 });
    }

    const availableActions = NEGOTIATION_ACTIONS[application.status] ?? [];
    if (!availableActions.includes(body.action)) {
      return NextResponse.json({ error: "That action isn't available right now" }, { status: 409 });
    }

    const nextStatus = nextStatusForAction(application.status, body.action);
    if (!nextStatus) {
      return NextResponse.json({ error: "That action isn't available right now" }, { status: 409 });
    }

    if (body.action === "COUNTER") {
      if (!application.campaign.negotiable) {
        return NextResponse.json(
          { error: "This campaign's terms aren't negotiable" },
          { status: 409 },
        );
      }
      if (body.proposedBudget == null || !body.proposedDeliverables?.trim()) {
        return NextResponse.json(
          { error: "proposedBudget and proposedDeliverables are required to counter" },
          { status: 400 },
        );
      }
      const budgetNumber = Number(body.proposedBudget);
      if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
        return NextResponse.json({ error: "proposedBudget must be a positive number" }, { status: 400 });
      }

      const newBudget = Math.round(budgetNumber);
      const newDeliverables = body.proposedDeliverables.trim();

      const counterNotification: NotifyPayload = {
        ...counterparty,
        type: "COUNTER_OFFER",
        title: "You have a counter-offer",
        body: `${role === "BRAND" ? application.campaign.brand.companyName : application.creator.name} countered on "${application.campaign.title}": ${formatBudget(newBudget)} for ${newDeliverables}.`,
        linkUrl:
          role === "BRAND"
            ? "/dashboard/creator/applications"
            : `/dashboard/brand/campaigns/${application.campaignId}`,
      };

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.application.update({
          where: { id },
          data: {
            status: nextStatus,
            proposedBudget: newBudget,
            proposedDeliverables: newDeliverables,
            negotiationMessage: body.negotiationMessage?.trim() || null,
            round: application.round + 1,
            lastOfferBy: role,
          },
        });

        await logCampaignActivity(
          {
            campaignId: application.campaignId,
            applicationId: application.id,
            actorId: userId,
            actorRole: role,
            actionType: "COUNTER_OFFER_SENT",
            details: {
              changes: [
                { field: "budget", oldValue: application.proposedBudget, newValue: newBudget },
                {
                  field: "deliverables",
                  oldValue: application.proposedDeliverables,
                  newValue: newDeliverables,
                },
              ],
            },
          },
          tx,
        );

        await writeNotifications(tx, [counterNotification]);

        return result;
      });

      await deliverNotificationEmails([counterNotification]);
      return NextResponse.json({ application: updated });
    }

    // ACCEPT or DECLINE — terms lock at whatever is currently proposed, no field changes needed.
    const settlementNotifications: NotifyPayload[] =
      nextStatus === "CONFIRMED"
        ? [
            {
              userId: application.campaign.brand.user.id,
              email: application.campaign.brand.user.email,
              emailEnabled: application.campaign.brand.user.emailNotifications,
              type: "TERMS_AGREED",
              title: "Terms agreed — fund escrow to start",
              body: `You and ${application.creator.name} agreed ${formatBudget(application.proposedBudget)} for "${application.campaign.title}". Fund escrow so they can begin — they will not start work until the money is held.`,
              linkUrl: `/dashboard/brand/campaigns/${application.campaignId}`,
            },
            {
              userId: application.creator.user.id,
              email: application.creator.user.email,
              emailEnabled: application.creator.user.emailNotifications,
              type: "TERMS_AGREED",
              title: "Terms agreed",
              body: `${application.campaign.brand.companyName} agreed ${formatBudget(application.proposedBudget)} for "${application.campaign.title}". Wait for escrow to be funded before starting work — you will be notified.`,
              linkUrl: "/dashboard/creator/applications",
            },
          ]
        : [
            {
              ...counterparty,
              type: "APPLICATION_DECLINED",
              title: "Application declined",
              body: `${role === "BRAND" ? application.campaign.brand.companyName : application.creator.name} declined the deal on "${application.campaign.title}".`,
              linkUrl:
                role === "BRAND"
                  ? "/dashboard/creator/applications"
                  : `/dashboard/brand/campaigns/${application.campaignId}`,
            },
          ];

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.application.update({ where: { id }, data: { status: nextStatus } });

      if (nextStatus === "CONFIRMED") {
        // Freeze what was agreed. This snapshot is what both sides accept and
        // what an admin reads if the deal is later disputed, so it must not
        // move when the campaign or profile is edited afterwards.
        await tx.contract.upsert({
          where: { applicationId: application.id },
          create: {
            applicationId: application.id,
            campaignTitle: application.campaign.title,
            budget: application.proposedBudget,
            deliverables: application.proposedDeliverables,
            deadline: application.campaign.deadline,
            brandName: application.campaign.brand.name,
            brandCompanyName: application.campaign.brand.companyName,
            creatorName: application.creator.name,
            creatorHandle: application.creator.instagramHandle,
          },
          update: {},
        });

        await logCampaignActivity(
          {
            campaignId: application.campaignId,
            applicationId: application.id,
            actorId: userId,
            actorRole: role,
            actionType: "TERMS_AGREED",
            details: {
              note: `${formatBudget(application.proposedBudget)} for ${application.proposedDeliverables}`,
            },
          },
          tx,
        );
      } else {
        await logCampaignActivity(
          {
            campaignId: application.campaignId,
            applicationId: application.id,
            actorId: userId,
            actorRole: role,
            actionType: "COUNTER_OFFER_DECLINED",
          },
          tx,
        );
      }

      await writeNotifications(tx, settlementNotifications);

      return result;
    });

    await deliverNotificationEmails(settlementNotifications);
    return NextResponse.json({ application: updated });
  }

  // Simple forward-only pipeline once terms are agreed (Confirmed -> Content Submitted -> Approved). Brand-only.
  if (body.status) {
    if (role !== "BRAND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const allowed = ALLOWED_TRANSITIONS[application.status] ?? [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot move from ${application.status} to ${body.status}` },
        { status: 409 },
      );
    }
    const previousStatus = application.status;
    const nextApplicationStatus = body.status;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.application.update({
        where: { id },
        data: {
          status: nextApplicationStatus,
          // Starts the auto-release clock: the brand has a fixed window to
          // approve before escrow releases itself.
          ...(nextApplicationStatus === "CONTENT_SUBMITTED"
            ? { contentSubmittedAt: new Date() }
            : {}),
        },
      });
      await logCampaignActivity(
        {
          campaignId: application.campaignId,
          applicationId: application.id,
          actorId: userId,
          actorRole: role,
          actionType: "STATUS_CHANGED",
          details: {
            changes: [{ field: "status", oldValue: previousStatus, newValue: nextApplicationStatus }],
          },
        },
        tx,
      );

      // Once enough creators are approved to fill the campaign's quota, close it to new applicants.
      if (nextApplicationStatus === "APPROVED" && application.campaign.status === "APPROVED") {
        const approvedCount = await tx.application.count({
          where: {
            campaignId: application.campaignId,
            // RELEASED is an approved deal that has already been paid out, so
            // it still counts against the quota.
            status: { in: ["APPROVED", "RELEASED"] },
          },
        });

        if (approvedCount >= application.campaign.creatorsNeeded) {
          await tx.campaign.update({
            where: { id: application.campaignId },
            data: { status: "CLOSED" },
          });
          await logCampaignActivity(
            {
              campaignId: application.campaignId,
              actorId: userId,
              actorRole: role,
              actionType: "STATUS_CHANGED",
              details: {
                note: `Auto-closed — creator quota reached (${approvedCount}/${application.campaign.creatorsNeeded}).`,
              },
            },
            tx,
          );
        }
      }

      return result;
    });

    // Approving the work releases the money. Done after the status transition
    // commits (and outside it, because releasing talks to the payment layer),
    // and it is what moves the application on to RELEASED.
    if (nextApplicationStatus === "APPROVED") {
      const release = await releaseEscrow({
        applicationId: application.id,
        actorId: userId,
        actorRole: role,
        note: "Released on brand approval.",
      });

      if (!release.released) {
        // Legacy deals predating escrow have no funded row; the approval still
        // stands, there is simply nothing to pay out.
        console.info(`[escrow] release skipped for ${application.id}: ${release.reason}`);
      }
    }

    if (nextApplicationStatus === "CONTENT_SUBMITTED") {
      const notification: NotifyPayload = {
        userId: application.campaign.brand.userId,
        email: application.campaign.brand.user.email,
        emailEnabled: application.campaign.brand.user.emailNotifications,
        type: "CONTENT_SUBMITTED",
        title: "Content submitted for review",
        body: `${application.creator.name} submitted content for "${application.campaign.title}". You have ${AUTO_RELEASE_DAYS} days to approve before escrow releases automatically.`,
        linkUrl: `/dashboard/brand/campaigns/${application.campaignId}`,
      };
      await prisma.$transaction(async (tx) => writeNotifications(tx, [notification]));
      await deliverNotificationEmails([notification]);
    }

    return NextResponse.json({ application: updated });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
