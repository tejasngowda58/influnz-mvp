import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logCampaignActivity } from "@/lib/activity-log";

/**
 * Both sides click to accept the frozen terms. Timestamps plus the audit log
 * are what settle a later "that's not what we agreed" argument — no e-signature
 * vendor involved.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "BRAND" && session.user.role !== "CREATOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;

  const { applicationId } = await params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { contract: true, creator: true, campaign: { include: { brand: true } } },
  });

  if (!application?.contract) {
    return NextResponse.json({ error: "No contract for this deal yet" }, { status: 404 });
  }

  const isBrandParty = application.campaign.brand.userId === session.user.id;
  const isCreatorParty = application.creator.userId === session.user.id;
  if (!isBrandParty && !isCreatorParty) {
    return NextResponse.json({ error: "No contract for this deal yet" }, { status: 404 });
  }

  const alreadyAccepted = isBrandParty
    ? application.contract.brandAcceptedAt
    : application.contract.creatorAcceptedAt;
  if (alreadyAccepted) {
    return NextResponse.json({ contract: application.contract });
  }

  const contract = await prisma.$transaction(async (tx) => {
    const updated = await tx.contract.update({
      where: { applicationId },
      data: isBrandParty ? { brandAcceptedAt: new Date() } : { creatorAcceptedAt: new Date() },
    });

    await logCampaignActivity(
      {
        campaignId: application.campaignId,
        applicationId,
        actorId: session.user.id,
        actorRole: role,
        actionType: "CONTRACT_ACCEPTED",
        details: {
          note: `${isBrandParty ? "Brand" : "Creator"} accepted the agreed terms.`,
        },
      },
      tx,
    );

    return updated;
  });

  return NextResponse.json({ contract });
}
