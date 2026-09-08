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

interface CreateCampaignBody {
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

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BRAND") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateCampaignBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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

  const brandProfile = await prisma.brandProfile.findUnique({ where: { userId: session.user.id } });
  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          brandId: brandProfile.id,
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
        },
      });

      await logCampaignActivity(
        {
          campaignId: created.id,
          actorId: session.user.id,
          actorRole: "BRAND",
          actionType: "CAMPAIGN_CREATED",
        },
        tx,
      );

      return created;
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Campaign creation failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
