import Link from "next/link";
import type { CampaignStatus } from "@prisma/client";
import { ClipboardList } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { CampaignStatusBadge } from "../../_components/campaign-status-badge";
import { Card } from "@/app/_components/ui/card";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate } from "@/lib/format";

const TABS: { label: string; value?: CampaignStatus }[] = [
  { label: "Pending review", value: "PENDING_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Changes requested", value: "CHANGES_REQUESTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Closed", value: "CLOSED" },
  { label: "All" },
];

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const activeStatus = (status as CampaignStatus | undefined) ?? "PENDING_REVIEW";

  const campaigns = await prisma.campaign.findMany({
    where: status === undefined ? { status: "PENDING_REVIEW" } : status === "ALL" ? {} : { status: activeStatus },
    orderBy: { createdAt: "desc" },
    include: { brand: { select: { companyName: true } } },
  });

  return (
    <DashboardShell role="Admin">
      <div>
        <h1 className="text-2xl font-semibold text-strong">Campaigns</h1>
        <p className="mt-1 text-sm text-muted">Review campaigns submitted by brands.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const href = tab.value
            ? `/dashboard/admin/campaigns?status=${tab.value}`
            : "/dashboard/admin/campaigns?status=ALL";
          const isActive = tab.value ? activeStatus === tab.value && status !== "ALL" : status === "ALL";
          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-ember text-white"
                  : "border border-line-strong bg-white text-muted hover:bg-paper"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-surface border border-dashed border-line-strong py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-tint text-ember">
            <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-strong">No campaigns here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/dashboard/admin/campaigns/${campaign.id}`}>
              <Card className="flex items-center justify-between gap-4 p-5 transition-colors hover:border-line-strong">
                <div>
                  <p className="font-semibold text-strong">{campaign.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {campaign.brand.companyName} · {formatBudget(campaign.budget)} ·{" "}
                    Submitted {formatDate(campaign.createdAt)}
                  </p>
                </div>
                <CampaignStatusBadge status={campaign.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
