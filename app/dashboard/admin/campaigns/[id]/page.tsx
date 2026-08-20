import { notFound } from "next/navigation";
import { Building2, Calendar, Globe, MapPin, Tag, Wallet } from "lucide-react";
import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { CampaignStatusBadge } from "../../../_components/campaign-status-badge";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { AdminReviewActions } from "./admin-review-actions";
import { ActivityTimeline } from "../../../_components/activity-timeline";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate, formatEnumLabel } from "@/lib/format";
import { ACTOR_DISPLAY_SELECT, resolveActorDisplayName } from "@/lib/activity-log";

export default async function AdminCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { brand: true },
  });

  if (!campaign) {
    notFound();
  }

  const activities = await prisma.campaignActivity.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: ACTOR_DISPLAY_SELECT } },
  });

  const timelineEntries = activities.map((activity) => ({
    id: activity.id,
    actorRole: activity.actorRole,
    actorName: resolveActorDisplayName(activity.actor),
    actionType: activity.actionType,
    details: activity.details,
    createdAt: activity.createdAt,
  }));

  return (
    <DashboardShell role="Admin">
      <BackLink href="/dashboard/admin/campaigns" label="Back to campaigns" />

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

        {campaign.adminComment && (
          <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
            <h3 className="text-xs font-medium tracking-wide text-orange-600 uppercase">
              Previous admin comment
            </h3>
            <p className="mt-1 text-sm text-gray-700">{campaign.adminComment}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-gray-900">Brand</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
            {campaign.brand.companyName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
            {campaign.brand.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
            {campaign.brand.companyWebsite}
          </span>
        </div>
      </Card>

      {campaign.status === "PENDING_REVIEW" && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900">Review this campaign</h2>
          <div className="mt-4">
            <AdminReviewActions campaignId={campaign.id} />
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-gray-900">Activity timeline</h2>
        <div className="mt-4">
          <ActivityTimeline entries={timelineEntries} />
        </div>
      </Card>
    </DashboardShell>
  );
}
