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

  const application = await prisma.application.findUnique({
    where: { id },
    include: { campaign: { include: { brand: true } }, creator: true },
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

        return result;
      });
      return NextResponse.json({ application: updated });
    }

    // ACCEPT or DECLINE — terms lock at whatever is currently proposed, no field changes needed.
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.application.update({ where: { id }, data: { status: nextStatus } });

      if (nextStatus === "CONFIRMED") {
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

      return result;
    });
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
        data: { status: nextApplicationStatus },
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
          where: { campaignId: application.campaignId, status: "APPROVED" },
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
    return NextResponse.json({ application: updated });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
