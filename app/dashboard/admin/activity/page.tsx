import Link from "next/link";
import { AlertTriangle, Clock, History, ShieldAlert } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { BackLink } from "../../_components/back-link";
import { StatCard } from "../../_components/stat-card";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { EmptyState } from "../../_components/empty-state";
import { Button, LinkButton } from "@/app/_components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { ACTOR_DISPLAY_SELECT, resolveActorDisplayName, summarizeActivityDetails } from "@/lib/activity-log";
import { ACTION_TYPES, buildActivityWhere, getAnomalyCounts } from "@/lib/activity-query";
import { INPUT_CLASSES } from "@/lib/ui-classes";

const PAGE_SIZE = 25;

interface SearchParams {
  actionType?: string;
  from?: string;
  to?: string;
  search?: string;
  anomaly?: string;
  page?: string;
}

function buildQueryString(params: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  Object.entries(merged).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const anomalies = await getAnomalyCounts();
  const where = buildActivityWhere(params, anomalies);

  const [activities, total] = await Promise.all([
    prisma.campaignActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        campaign: { select: { id: true, title: true } },
        actor: { select: ACTOR_DISPLAY_SELECT },
      },
    }),
    prisma.campaignActivity.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(params.actionType || params.from || params.to || params.search || params.anomaly);

  // Grouped by campaign so the page reads as a set of evidence trails rather
  // than one undifferentiated log. Campaign order follows the newest event.
  const grouped: {
    campaignId: string;
    campaignTitle: string;
    entries: typeof activities;
  }[] = [];

  for (const activity of activities) {
    const existing = grouped.find((group) => group.campaignId === activity.campaign.id);
    if (existing) {
      existing.entries.push(activity);
    } else {
      grouped.push({
        campaignId: activity.campaign.id,
        campaignTitle: activity.campaign.title,
        entries: [activity],
      });
    }
  }

  return (
    <DashboardShell role="Admin">
      <BackLink href="/dashboard/admin" label="Back to dashboard" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-strong">Activity log</h1>
          <p className="mt-1 text-sm text-muted">
            Every campaign and negotiation event across the platform, for oversight and dispute review.
          </p>
        </div>
        <LinkButton href={`/api/admin/activity/export${buildQueryString(params, { page: undefined })}`} variant="outline" size="sm">
          Export CSV
        </LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          href={`/dashboard/admin/activity${buildQueryString({}, { anomaly: "extended_negotiation" })}`}
          icon={AlertTriangle}
          label="Extended negotiations"
          value={anomalies.extendedNegotiation.count}
          description="Reached the 2-counter negotiation cap — may be stuck."
        />
        <StatCard
          href={`/dashboard/admin/activity${buildQueryString({}, { anomaly: "dispute" })}`}
          icon={ShieldAlert}
          label="Disputes raised"
          value={anomalies.dispute.count}
          description="Campaigns with an open dispute."
        />
        <StatCard
          href={`/dashboard/admin/activity${buildQueryString({}, { anomaly: "stale_pending" })}`}
          icon={Clock}
          label="Pending > 48h"
          value={anomalies.stalePending.count}
          description="Awaiting your review for over 2 days."
        />
      </div>

      <form method="GET" action="/dashboard/admin/activity" className="flex flex-wrap items-end gap-3 rounded-surface border border-line bg-white p-4">
        {params.anomaly && <input type="hidden" name="anomaly" value={params.anomaly} />}
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-muted">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={params.search}
            placeholder="Campaign or actor name"
            className={INPUT_CLASSES}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="actionType" className="text-xs font-medium text-muted">
            Action type
          </label>
          <select id="actionType" name="actionType" defaultValue={params.actionType ?? ""} className={INPUT_CLASSES}>
            <option value="">All actions</option>
            {ACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-muted">
            From
          </label>
          <input id="from" name="from" type="date" defaultValue={params.from} className={INPUT_CLASSES} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-muted">
            To
          </label>
          <input id="to" name="to" type="date" defaultValue={params.to} className={INPUT_CLASSES} />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
        {hasFilters && (
          <LinkButton href="/dashboard/admin/activity" variant="ghost" size="sm">
            Clear
          </LinkButton>
        )}
      </form>

      {activities.length === 0 ? (
        <EmptyState
          icon={History}
          title={hasFilters ? "No activity matches those filters" : "No activity recorded yet"}
          body={
            hasFilters
              ? "Try widening the date range, or clearing the action type to see everything on the platform."
              : "Every campaign submission, review decision, offer, counter-offer, payment and dispute lands here as it happens. It is the evidence trail behind any decision you have to make."
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((group) => (
            <Card key={group.campaignId} radius="surface" className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper px-5 py-3">
                <Link
                  href={`/dashboard/admin/campaigns/${group.campaignId}`}
                  className="font-semibold text-strong hover:text-ember"
                >
                  {group.campaignTitle}
                </Link>
                <span className="text-xs text-muted">
                  {group.entries.length} {group.entries.length === 1 ? "event" : "events"} on this page
                </span>
              </div>

              <ol className="divide-y divide-line">
                {group.entries.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3 text-sm"
                  >
                    <span className="font-medium text-strong">
                      {resolveActorDisplayName(activity.actor)}
                    </span>
                    <Badge tone={activity.actorRole === "ADMIN" ? "held" : "neutral"}>
                      {formatEnumLabel(activity.actorRole)}
                    </Badge>
                    <span className="text-muted">{formatEnumLabel(activity.actionType)}</span>
                    <span className="text-muted/80">{summarizeActivityDetails(activity.details)}</span>
                    <span className="ml-auto whitespace-nowrap text-xs text-muted/70">
                      {formatDateTime(activity.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {page} of {totalPages} — {total} events
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <LinkButton
                href={`/dashboard/admin/activity${buildQueryString(params, { page: String(page - 1) })}`}
                variant="ghost"
                size="sm"
              >
                Previous
              </LinkButton>
            )}
            {page < totalPages && (
              <LinkButton
                href={`/dashboard/admin/activity${buildQueryString(params, { page: String(page + 1) })}`}
                variant="ghost"
                size="sm"
              >
                Next
              </LinkButton>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
