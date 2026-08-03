import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ReviewAction = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

const RESULT_STATUS: Record<ReviewAction, "APPROVED" | "CHANGES_REQUESTED" | "REJECTED"> = {
  APPROVE: "APPROVED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  REJECT: "REJECTED",
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

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "PENDING_REVIEW") {
    return NextResponse.json({ error: "This campaign isn't awaiting review" }, { status: 409 });
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: RESULT_STATUS[body.action],
      adminComment: body.comment?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ campaign: updated });
}
