import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ApplyBody {
  pitch?: string;
  proposedBudget?: number;
  proposedDeliverables?: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CREATOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: ApplyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!creatorProfile) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "APPROVED") {
    return NextResponse.json({ error: "This campaign is no longer accepting applications" }, { status: 409 });
  }

  let proposedBudget = campaign.budget;
  let proposedDeliverables = campaign.deliverables;

  if (campaign.negotiable) {
    if (body.proposedBudget != null) {
      const budgetNumber = Number(body.proposedBudget);
      if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
        return NextResponse.json({ error: "proposedBudget must be a positive number" }, { status: 400 });
      }
      proposedBudget = Math.round(budgetNumber);
    }
    if (body.proposedDeliverables?.trim()) {
      proposedDeliverables = body.proposedDeliverables.trim();
    }
  }

  try {
    const application = await prisma.application.create({
      data: {
        campaignId: campaign.id,
        creatorId: creatorProfile.id,
        pitch: body.pitch?.trim() || null,
        proposedBudget,
        proposedDeliverables,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "You've already applied to this campaign" }, { status: 409 });
    }
    console.error("Campaign application failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
