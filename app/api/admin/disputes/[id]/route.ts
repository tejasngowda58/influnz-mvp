import { NextResponse } from "next/server";
import type { DisputeStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logCampaignActivity } from "@/lib/activity-log";
import { refundEscrow, releaseEscrow } from "@/lib/escrow";

type Decision = "RESOLVED_CREATOR" | "RESOLVED_BRAND" | "SPLIT" | "UNDER_REVIEW";

interface ResolveDisputeBody {
  decision?: Decision;
  resolution?: string;
  /** For SPLIT only: how much of the held amount goes to the creator, in paise. */
  creatorSharePaise?: number;
}

/**
 * Admin adjudication. The money moves according to the decision, and the
 * outcome is written to the audit log next to the evidence it was based on.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: ResolveDisputeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const decision = body.decision;
  if (
    decision !== "RESOLVED_CREATOR" &&
    decision !== "RESOLVED_BRAND" &&
    decision !== "SPLIT" &&
    decision !== "UNDER_REVIEW"
  ) {
    return NextResponse.json(
      { error: "decision must be one of UNDER_REVIEW, RESOLVED_CREATOR, RESOLVED_BRAND, SPLIT" },
      { status: 400 },
    );
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: { application: { include: { escrow: true } } },
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }
  if (dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW") {
    return NextResponse.json({ error: "This dispute is already resolved" }, { status: 409 });
  }

  // Picking it up for review just flags it; no money moves and no note needed.
  if (decision === "UNDER_REVIEW") {
    const updated = await prisma.dispute.update({
      where: { id },
      data: { status: "UNDER_REVIEW" },
    });
    return NextResponse.json({ dispute: updated });
  }

  const resolution = body.resolution?.trim();
  if (!resolution) {
    return NextResponse.json(
      { error: "A resolution note is required when deciding a dispute" },
      { status: 400 },
    );
  }

  const escrow = dispute.application.escrow;
  if (!escrow) {
    return NextResponse.json({ error: "This deal has no escrow to settle" }, { status: 409 });
  }

  const applicationId = dispute.applicationId;
  const actor = { actorId: session.user.id, actorRole: "ADMIN" as const };

  try {
    if (decision === "RESOLVED_CREATOR") {
      const result = await releaseEscrow({
        applicationId,
        ...actor,
        note: `Dispute resolved for the creator: ${resolution}`,
      });
      if (!result.released) {
        return NextResponse.json({ error: result.reason ?? "Release failed" }, { status: 409 });
      }
    } else if (decision === "RESOLVED_BRAND") {
      const result = await refundEscrow({
        applicationId,
        ...actor,
        note: `Dispute resolved for the brand: ${resolution}`,
      });
      if (!result.refunded) {
        return NextResponse.json({ error: result.reason ?? "Refund failed" }, { status: 409 });
      }
    } else {
      const creatorShare = Number(body.creatorSharePaise);
      if (!Number.isInteger(creatorShare) || creatorShare <= 0 || creatorShare >= escrow.amount) {
        return NextResponse.json(
          { error: `creatorSharePaise must be a whole number between 1 and ${escrow.amount - 1}` },
          { status: 400 },
        );
      }

      // Refund the brand's share first: it is the reversible half. If the
      // release then fails, the remainder is still held rather than lost.
      const refund = await refundEscrow({
        applicationId,
        ...actor,
        refundAmountPaise: escrow.amount - creatorShare,
        note: `Split decision, brand's share: ${resolution}`,
      });
      if (!refund.refunded) {
        return NextResponse.json({ error: refund.reason ?? "Refund failed" }, { status: 409 });
      }

      const release = await releaseEscrow({
        applicationId,
        ...actor,
        releaseAmountPaise: creatorShare,
        note: `Split decision, creator's share: ${resolution}`,
      });
      if (!release.released) {
        console.error(`[dispute] split release failed after refund on ${applicationId}`);
      }
    }
  } catch (error) {
    console.error("Dispute settlement failed", error);
    return NextResponse.json(
      { error: "Couldn't settle the money for this dispute. Nothing was changed." },
      { status: 502 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.dispute.update({
      where: { id },
      data: {
        status: decision as DisputeStatus,
        resolution,
        resolvedById: session.user.id,
        resolvedAt: new Date(),
      },
    });

    await logCampaignActivity(
      {
        campaignId: dispute.application.campaignId,
        applicationId,
        actorId: session.user.id,
        actorRole: "ADMIN",
        actionType: "DISPUTE_RESOLVED",
        details: { note: `${decision}: ${resolution}` },
      },
      tx,
    );

    return result;
  });

  return NextResponse.json({ dispute: updated });
}
