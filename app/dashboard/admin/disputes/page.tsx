import Link from "next/link";
import type { DisputeStatus } from "@prisma/client";
import { Scale } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { Card } from "@/app/_components/ui/card";
import { Badge, type BadgeTone } from "@/app/_components/ui/badge";
import { MetaRow } from "../../_components/meta-row";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { formatPaise } from "@/lib/money";

export const DISPUTE_TONES: Record<DisputeStatus, BadgeTone> = {
  OPEN: "stopped",
  UNDER_REVIEW: "frozen",
  RESOLVED_CREATOR: "settled",
  RESOLVED_BRAND: "settled",
  SPLIT: "held",
};

export const DISPUTE_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  RESOLVED_CREATOR: "Resolved — creator",
  RESOLVED_BRAND: "Resolved — brand",
  SPLIT: "Split",
};

const TABS: { label: string; value: string }[] = [
  { label: "Needs a decision", value: "OPEN" },
  { label: "All", value: "ALL" },
];

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const activeTab = status === "ALL" ? "ALL" : "OPEN";

  const disputes = await prisma.dispute.findMany({
    where: activeTab === "ALL" ? {} : { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          escrow: { select: { amount: true, status: true } },
          creator: { select: { name: true } },
          campaign: { select: { title: true, brand: { select: { companyName: true } } } },
        },
      },
    },
  });

  return (
    <DashboardShell role="Admin">
      <div>
        <h1 className="text-2xl font-semibold text-strong">Disputes</h1>
        <p className="mt-1 text-sm text-muted">
          Money stays frozen in escrow until you decide. Every decision is written to the activity log.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/admin/disputes?status=${tab.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-ember text-white"
                : "border border-line-strong bg-white text-muted hover:bg-paper"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {disputes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-surface border border-dashed border-line-strong py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-settled/5 text-settled">
            <Scale className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-strong">
            {activeTab === "OPEN" ? "No disputes waiting on you" : "No disputes yet"}
          </p>
          <p className="max-w-sm text-sm text-muted">
            Disputes appear here the moment either side raises one on a funded deal.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map((dispute) => (
            <Link key={dispute.id} href={`/dashboard/admin/disputes/${dispute.id}`}>
              <Card className="flex items-start justify-between gap-4 p-5 transition-colors hover:border-line-strong">
                <div className="min-w-0">
                  <p className="font-semibold text-strong">{dispute.reason}</p>
                  <MetaRow
                    className="mt-2"
                    items={[
                      { label: "Campaign", value: dispute.application.campaign.title },
                      {
                        label: "Parties",
                        value: `${dispute.application.campaign.brand.companyName} vs ${dispute.application.creator.name}`,
                      },
                      { label: "Raised by", value: dispute.raisedByRole.toLowerCase() },
                      { label: "Raised", value: formatDateTime(dispute.createdAt) },
                    ]}
                  />
                </div>
                <div className="flex flex-none flex-col items-end gap-2">
                  <Badge tone={DISPUTE_TONES[dispute.status]}>{DISPUTE_LABELS[dispute.status]}</Badge>
                  {dispute.application.escrow && (
                    <span className="text-sm font-semibold text-strong">
                      {formatPaise(dispute.application.escrow.amount)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
