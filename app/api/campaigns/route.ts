import { NextResponse } from "next/server";
import type { ContentCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const { title, description, category, city, budget, deliverables, targetAudience, deadline, negotiable } = body;

  if (!title || !description || !category || !deliverables || !deadline || budget == null) {
    return NextResponse.json(
      { error: "title, description, category, budget, deliverables, and deadline are all required" },
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

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return NextResponse.json({ error: "deadline must be a valid date" }, { status: 400 });
  }

  const brandProfile = await prisma.brandProfile.findUnique({ where: { userId: session.user.id } });
  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        brandId: brandProfile.id,
        title,
        description,
        category: category as ContentCategory,
        city: city?.trim() || null,
        budget: Math.round(budgetNumber),
        deliverables,
        targetAudience: targetAudience?.trim() || null,
        deadline: deadlineDate,
        negotiable: Boolean(negotiable),
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Campaign creation failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
