import { notFound } from "next/navigation";
import { Calendar, MapPin, Tag, Wallet } from "lucide-react";
import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { ApplicationStatusBadge } from "../../../_components/status-badge";
import { ApplyForm } from "./apply-form";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate, formatEnumLabel } from "@/lib/format";

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

  if (!campaign) {
    notFound();
  }

  const existingApplication = creatorProfile
    ? await prisma.application.findUnique({
        where: { campaignId_creatorId: { campaignId: campaign.id, creatorId: creatorProfile.id } },
      })
    : null;

  return (
    <DashboardShell role="Creator" name={creatorProfile?.name}>
      <BackLink href="/dashboard/creator/campaigns" label="Back to campaigns" />
      <Card className="flex flex-col gap-4 p-8">
        <div>
          <p className="text-sm font-medium text-orange-600">{campaign.brand.companyName}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{campaign.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">{campaign.description}</p>
        </div>

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

      <Card className="p-8">
        {campaign.status === "CLOSED" && !existingApplication ? (
          <div className="flex items-center gap-3">
            <Badge tone="gray">Closed</Badge>
            <p className="text-sm text-gray-600">This campaign is no longer accepting applications.</p>
          </div>
        ) : existingApplication ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Your application</h2>
            <div className="mt-2 flex items-center gap-2">
              <ApplicationStatusBadge status={existingApplication.status} />
              <p className="text-sm text-gray-600">
                Applied on {formatDate(existingApplication.createdAt)}
              </p>
            </div>
            {existingApplication.pitch && (
              <p className="mt-3 text-sm text-gray-700">{existingApplication.pitch}</p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Apply to this campaign</h2>
            <div className="mt-4">
              <ApplyForm campaignId={campaign.id} />
            </div>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
