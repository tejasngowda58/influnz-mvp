import Link from "next/link";
import { AlertTriangle, Clock, History, ShieldAlert } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { BackLink } from "../../_components/back-link";
import { StatCard } from "../../_components/stat-card";
import { Card } from "@/app/_components/ui/card";
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
        <div className="flex flex-col items-center gap-3 rounded-surface border border-dashed border-line-strong py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-tint text-ember">
            <History className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-strong">No activity matches those filters</p>
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs font-medium tracking-wide text-muted/70 uppercase">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admin/campaigns/${activity.campaign.id}`}
                      className="font-medium text-strong hover:text-ember"
                    >
                      {activity.campaign.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {resolveActorDisplayName(activity.actor)}
                    <span className="ml-1 text-xs text-muted/70">({formatEnumLabel(activity.actorRole)})</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatEnumLabel(activity.actionType)}</td>
                  <td className="px-4 py-3 text-muted">{summarizeActivityDetails(activity.details)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted/70">
                    {formatDateTime(activity.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {page} of {totalPages} · {total} total
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
