import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Tag, Users, Wallet } from "lucide-react";
import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { LinkButton } from "@/app/_components/ui/button";
import { CampaignStatusBadge } from "../../../_components/campaign-status-badge";
import { ApplicationStatusBadge } from "../../../_components/status-badge";
import { NegotiationPanel } from "../../../_components/negotiation-panel";
import { EscrowPanel } from "../../../_components/escrow-panel";
import { StatusBanner } from "../../../_components/status-banner";
import { CampaignStatusToggle } from "./campaign-status-toggle";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate, formatEnumLabel } from "@/lib/format";
import { NEGOTIATION_TURN } from "@/lib/application-status";
import { isRazorpayConfigured } from "@/lib/razorpay";

export default async function BrandCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("BRAND");
  const { id } = await params;

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const campaign = brandProfile
    ? await prisma.campaign.findFirst({
        where: { id, brandId: brandProfile.id },
        include: {
          applications: {
            orderBy: { createdAt: "desc" },
            include: {
              creator: true,
              escrow: true,
              disputes: { select: { status: true } },
            },
          },
        },
      })
    : null;

  if (!campaign) {
    notFound();
  }

  const sortedApplications = [...campaign.applications].sort((a, b) => {
    const aNeedsResponse = NEGOTIATION_TURN[a.status] === "BRAND" ? 0 : 1;
    const bNeedsResponse = NEGOTIATION_TURN[b.status] === "BRAND" ? 0 : 1;
    return aNeedsResponse - bNeedsResponse;
  });
  const needsResponseCount = campaign.applications.filter(
    (application) => NEGOTIATION_TURN[application.status] === "BRAND",
  ).length;
  const approvedCount = campaign.applications.filter(
    (application) => application.status === "APPROVED" || application.status === "RELEASED",
  ).length;
  const paymentsEnabled = isRazorpayConfigured();
  const quotaReached = approvedCount >= campaign.creatorsNeeded;

  return (
    <DashboardShell role="Brand" name={brandProfile?.name}>
      <BackLink href="/dashboard/brand/campaigns" label="Back to campaigns" />
      <Card className="flex flex-col gap-4 p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">{campaign.title}</h1>
              <CampaignStatusBadge status={campaign.status} />
              {campaign.negotiable && <Badge tone="blue">Negotiable</Badge>}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">{campaign.description}</p>
          </div>
          {(campaign.status === "APPROVED" || campaign.status === "CLOSED") && (
            <CampaignStatusToggle campaignId={campaign.id} status={campaign.status} />
          )}
        </div>

        {campaign.status === "CHANGES_REQUESTED" && (
          <StatusBanner tone="orange" title="Admin requested changes">
            <p>{campaign.adminComment}</p>
            <LinkButton href={`/dashboard/brand/campaigns/${campaign.id}/edit`} size="sm" className="mt-3">
              Edit &amp; resubmit
            </LinkButton>
          </StatusBanner>
        )}

        {campaign.status === "REJECTED" && (
          <StatusBanner tone="red" title="Rejected by admin">
            <p>{campaign.adminComment}</p>
          </StatusBanner>
        )}

        {campaign.status === "CLOSED" && quotaReached && (
          <StatusBanner tone="green" title="Campaign complete">
            <p>
              Creator quota reached ({approvedCount}/{campaign.creatorsNeeded}) — automatically closed to
              new applicants.
            </p>
          </StatusBanner>
        )}

        {campaign.status === "PENDING_REVIEW" && (
          <StatusBanner tone="gray" title="Pending review">
            <p>This campaign is waiting on admin review before it goes live for creators.</p>
          </StatusBanner>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Tag className="h-4 w-4" strokeWidth={1.75} />
            {formatEnumLabel(campaign.category)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
            {campaign.city || "Any city"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="h-4 w-4" strokeWidth={1.75} />
            {formatBudget(campaign.budget)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
            Due {formatDate(campaign.deadline)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" strokeWidth={1.75} />
            {approvedCount} of {campaign.creatorsNeeded} creators approved
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium tracking-wide text-gray-400 uppercase">Deliverables</h3>
            <p className="mt-1 text-sm text-gray-700">{campaign.deliverables}</p>
          </div>
          {campaign.targetAudience && (
            <div>
              <h3 className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                Target audience
              </h3>
              <p className="mt-1 text-sm text-gray-700">{campaign.targetAudience}</p>
            </div>
          )}
        </div>
      </Card>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Users className="h-4 w-4" strokeWidth={1.75} />
            Applications ({campaign.applications.length})
          </h2>
          {needsResponseCount > 0 && <Badge tone="blue">{needsResponseCount} need your response</Badge>}
        </div>

        {campaign.applications.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
            No applications yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {sortedApplications.map((application) => (
              <Card
                key={application.id}
                className={`flex flex-col gap-4 p-5 ${
                  NEGOTIATION_TURN[application.status] === "BRAND" ? "border-blue-200" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/brand/creators/${application.creator.id}`}
                        className="font-semibold text-gray-900 hover:text-orange-600"
                      >
                        {application.creator.name}
                      </Link>
                      <ApplicationStatusBadge status={application.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {application.creator.instagramHandle
                        ? `@${application.creator.instagramHandle.replace(/^@/, "")} · `
                        : "Instagram not connected · "}
                      {formatEnumLabel(application.creator.contentCategory)} · {application.creator.city}
                    </p>
                    {application.pitch && (
                      <p className="mt-2 max-w-xl text-sm text-gray-700">{application.pitch}</p>
                    )}
                  </div>
                </div>
                <EscrowPanel
                  applicationId={application.id}
                  viewerRole="BRAND"
                  applicationStatus={application.status}
                  escrow={application.escrow}
                  contentSubmittedAt={application.contentSubmittedAt}
                  hasOpenDispute={application.disputes.some(
                    (dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW",
                  )}
                  paymentsEnabled={paymentsEnabled}
                />
                <NegotiationPanel
                  applicationId={application.id}
                  status={application.status}
                  viewerRole="BRAND"
                  campaignNegotiable={campaign.negotiable}
                  proposedBudget={application.proposedBudget}
                  proposedDeliverables={application.proposedDeliverables}
                  round={application.round}
                  lastOfferBy={application.lastOfferBy}
                />
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
