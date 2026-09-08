import { notFound } from "next/navigation";

import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { ApplicationStatusBadge } from "../../../_components/status-badge";
import { NegotiationPanel } from "../../../_components/negotiation-panel";
import { EscrowPanel } from "../../../_components/escrow-panel";
import { MetaRow } from "../../../_components/meta-row";
import { ApplyForm } from "./apply-form";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate, formatEnumLabel } from "@/lib/format";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { loadOfferHistories } from "@/lib/offer-history";

export default async function CreatorCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("CREATOR");
  const { id } = await params;

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { brand: { select: { companyName: true } } },
  });

  if (!campaign || (campaign.status !== "APPROVED" && campaign.status !== "CLOSED")) {
    notFound();
  }

  const existingApplication = creatorProfile
    ? await prisma.application.findUnique({
        where: { campaignId_creatorId: { campaignId: campaign.id, creatorId: creatorProfile.id } },
        include: { escrow: true, disputes: { select: { status: true } } },
      })
    : null;

  const offerHistories = existingApplication
    ? await loadOfferHistories([existingApplication.id])
    : new Map();

  return (
    <DashboardShell role="Creator" name={creatorProfile?.name}>
      <BackLink href="/dashboard/creator/campaigns" label="Back to campaigns" />
      <Card className="flex flex-col gap-4 p-8">
        <div>
          <p className="text-sm font-medium text-ember-dark">{campaign.brand.companyName}</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-strong">{campaign.title}</h1>
            {campaign.negotiable && <Badge tone="accent">Negotiable</Badge>}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted">{campaign.description}</p>
        </div>

        <MetaRow
          className="border-t border-line pt-4"
          items={[
            { label: "Fee", value: formatBudget(campaign.budget) },
            { label: "Deadline", value: formatDate(campaign.deadline) },
            { label: "Category", value: formatEnumLabel(campaign.category) },
            { label: "City", value: campaign.city || "Any city" },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium text-muted">Deliverables</h3>
            <p className="mt-1 text-sm text-strong">{campaign.deliverables}</p>
          </div>
          {campaign.targetAudience && (
            <div>
              <h3 className="text-xs font-medium text-muted">
                Target audience
              </h3>
              <p className="mt-1 text-sm text-strong">{campaign.targetAudience}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-8">
        {campaign.status === "CLOSED" && !existingApplication ? (
          <div className="flex items-center gap-3">
            <Badge tone="neutral">Closed</Badge>
            <p className="text-sm text-muted">This campaign is no longer accepting applications.</p>
          </div>
        ) : existingApplication ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-strong">Your application</h2>
              <div className="mt-2 flex items-center gap-2">
                <ApplicationStatusBadge status={existingApplication.status} />
                <p className="text-sm text-muted">
                  Applied on {formatDate(existingApplication.createdAt)}
                </p>
              </div>
              {existingApplication.pitch && (
                <p className="mt-3 text-sm text-strong">{existingApplication.pitch}</p>
              )}
            </div>
            <EscrowPanel
              applicationId={existingApplication.id}
              viewerRole="CREATOR"
              applicationStatus={existingApplication.status}
              escrow={existingApplication.escrow}
              contentSubmittedAt={existingApplication.contentSubmittedAt}
              hasOpenDispute={existingApplication.disputes.some(
                (dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW",
              )}
              paymentsEnabled={isRazorpayConfigured()}
            />
            <NegotiationPanel
              applicationId={existingApplication.id}
              status={existingApplication.status}
              viewerRole="CREATOR"
              campaignNegotiable={campaign.negotiable}
              proposedBudget={existingApplication.proposedBudget}
              proposedDeliverables={existingApplication.proposedDeliverables}
              negotiationMessage={existingApplication.negotiationMessage}
              round={existingApplication.round}
              lastOfferBy={existingApplication.lastOfferBy}
              brandName={campaign.brand.companyName}
              creatorName={creatorProfile?.name ?? "You"}
              history={offerHistories.get(existingApplication.id)}
            />
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-strong">Apply to this campaign</h2>
            <div className="mt-4">
              <ApplyForm
                campaignId={campaign.id}
                negotiable={campaign.negotiable}
                campaignBudget={campaign.budget}
                campaignDeliverables={campaign.deliverables}
              />
            </div>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
