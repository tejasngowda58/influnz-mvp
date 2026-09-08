import { NextResponse } from "next/server";
import type { ContentCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logCampaignActivity } from "@/lib/activity-log";

const CONTENT_CATEGORIES: ContentCategory[] = [
  "FASHION",
  "BEAUTY",
  "TECH",
  "FOOD",
  "FITNESS",
  "TRAVEL",
  "OTHER",
];

interface PatchCampaignBody {
  status?: string;
  title?: string;
  description?: string;
  category?: string;
  city?: string;
  budget?: number;
  deliverables?: string;
  targetAudience?: string;
  creatorsNeeded?: number;
  deadline?: string;
  negotiable?: boolean;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BRAND") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: PatchCampaignBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { brand: true } });
  if (!campaign || campaign.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Mode 1: open/close toggle on an already-reviewed campaign.
  if (body.status !== undefined) {
    if (body.status !== "APPROVED" && body.status !== "CLOSED") {
      return NextResponse.json({ error: "status must be APPROVED or CLOSED" }, { status: 400 });
    }
    if (campaign.status !== "APPROVED" && campaign.status !== "CLOSED") {
      return NextResponse.json(
        { error: "Only approved or closed campaigns can be reopened/closed" },
        { status: 409 },
      );
    }

    const previousStatus = campaign.status;
    const nextStatus = body.status;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaign.update({ where: { id }, data: { status: nextStatus } });
      await logCampaignActivity(
        {
          campaignId: id,
          actorId: session.user.id,
          actorRole: "BRAND",
          actionType: "STATUS_CHANGED",
          details: { changes: [{ field: "status", oldValue: previousStatus, newValue: nextStatus }] },
        },
        tx,
      );
      return result;
    });
    return NextResponse.json({ campaign: updated });
  }

  // Mode 2: edit-and-resubmit — only allowed while admin has requested changes.
  if (campaign.status !== "CHANGES_REQUESTED") {
    return NextResponse.json(
      { error: "This campaign can't be edited right now" },
      { status: 409 },
    );
  }

  const {
    title,
    description,
    category,
    city,
    budget,
    deliverables,
    targetAudience,
    creatorsNeeded,
    deadline,
    negotiable,
  } = body;

  if (
    !title ||
    !description ||
    !category ||
    !deliverables ||
    !deadline ||
    budget == null ||
    creatorsNeeded == null
  ) {
    return NextResponse.json(
      {
        error:
          "title, description, category, budget, deliverables, creatorsNeeded, and deadline are all required",
      },
      { status: 400 },
    );
  }

  if (!CONTENT_CATEGORIES.includes(category as ContentCategory)) {
    return NextResponse.json(
      { error: `category must be one of: ${CONTENT_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }

  const budgetNumber = Number(budget);
  if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
    return NextResponse.json({ error: "budget must be a positive number" }, { status: 400 });
  }

  const creatorsNeededNumber = Number(creatorsNeeded);
  if (!Number.isInteger(creatorsNeededNumber) || creatorsNeededNumber <= 0) {
    return NextResponse.json(
      { error: "creatorsNeeded must be a positive whole number" },
      { status: 400 },
    );
  }

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return NextResponse.json({ error: "deadline must be a valid date" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.campaign.update({
      where: { id },
      data: {
        title,
        description,
        category: category as ContentCategory,
        city: city?.trim() || null,
        budget: Math.round(budgetNumber),
        deliverables,
        targetAudience: targetAudience?.trim() || null,
        creatorsNeeded: creatorsNeededNumber,
        deadline: deadlineDate,
        negotiable: Boolean(negotiable),
        status: "PENDING_REVIEW",
        adminComment: null,
        reviewedAt: null,
      },
    });

    await logCampaignActivity(
      {
        campaignId: id,
        actorId: session.user.id,
        actorRole: "BRAND",
        actionType: "CAMPAIGN_SUBMITTED_FOR_REVIEW",
        details: {
          changes: [{ field: "budget", oldValue: campaign.budget, newValue: result.budget }],
        },
      },
      tx,
    );

    return result;
  });

  return NextResponse.json({ campaign: updated });
}
