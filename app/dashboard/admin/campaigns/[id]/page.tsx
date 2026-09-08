import { notFound } from "next/navigation";
import { Building2, Globe, MapPin } from "lucide-react";
import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { CampaignStatusBadge } from "../../../_components/campaign-status-badge";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { AdminReviewActions } from "./admin-review-actions";
import { ActivityTimeline } from "../../../_components/activity-timeline";
import { MetaRow } from "../../../_components/meta-row";
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
    include: { brand: true, applications: { select: { status: true } } },
  });

  if (!campaign) {
    notFound();
  }

  const approvedCount = campaign.applications.filter(
    (application) => application.status === "APPROVED",
  ).length;

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
              <h1 className="text-2xl font-semibold text-strong">{campaign.title}</h1>
              <CampaignStatusBadge status={campaign.status} />
              {campaign.negotiable && <Badge tone="accent">Negotiable</Badge>}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted">{campaign.description}</p>
          </div>
        </div>

        <MetaRow
          className="border-t border-line pt-4"
          items={[
            { label: "Budget", value: formatBudget(campaign.budget) },
            {
              label: "Creators",
              value: `${approvedCount} of ${campaign.creatorsNeeded} approved`,
            },
            { label: "Deadline", value: formatDate(campaign.deadline) },
            { label: "Category", value: formatEnumLabel(campaign.category) },
            { label: "City", value: campaign.city || "Any city" },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium text-muted/70">Deliverables</h3>
            <p className="mt-1 text-sm text-strong">{campaign.deliverables}</p>
          </div>
          {campaign.targetAudience && (
            <div>
              <h3 className="text-xs font-medium text-muted/70">
                Target audience
              </h3>
              <p className="mt-1 text-sm text-strong">{campaign.targetAudience}</p>
            </div>
          )}
        </div>

        {campaign.adminComment && (
          <div className="rounded-inset border border-ember/20 bg-ember-tint p-4">
            <h3 className="text-xs font-medium text-ember">
              Previous admin comment
            </h3>
            <p className="mt-1 text-sm text-strong">{campaign.adminComment}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-strong">Brand</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted/70" strokeWidth={1.75} />
            {campaign.brand.companyName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted/70" strokeWidth={1.75} />
            {campaign.brand.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-muted/70" strokeWidth={1.75} />
            {campaign.brand.companyWebsite}
          </span>
        </div>
      </Card>

      {campaign.status === "PENDING_REVIEW" && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-strong">Review this campaign</h2>
          <div className="mt-4">
            <AdminReviewActions campaignId={campaign.id} />
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-strong">Activity timeline</h2>
        <div className="mt-4">
          <ActivityTimeline entries={timelineEntries} />
        </div>
      </Card>
    </DashboardShell>
  );
}
