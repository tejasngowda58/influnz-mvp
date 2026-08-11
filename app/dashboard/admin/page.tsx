import { CheckCircle2, Clock, MessageSquareWarning, XCircle } from "lucide-react";
import { DashboardShell } from "../_components/dashboard-shell";
import { StatCard } from "../_components/stat-card";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const [pendingReview, approved, changesRequested, rejected] = await Promise.all([
    prisma.campaign.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.campaign.count({ where: { status: "APPROVED" } }),
    prisma.campaign.count({ where: { status: "CHANGES_REQUESTED" } }),
    prisma.campaign.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <DashboardShell role="Admin">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Campaign review</h1>
        <p className="mt-1 text-sm text-gray-600">
          Approve, request changes on, or reject campaigns before they reach creators.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/dashboard/admin/campaigns?status=PENDING_REVIEW"
          icon={Clock}
          label="Pending review"
          value={pendingReview}
          description="Awaiting your decision."
        />
        <StatCard
          href="/dashboard/admin/campaigns?status=APPROVED"
          icon={CheckCircle2}
          label="Approved"
          value={approved}
          description="Live and visible to creators."
        />
        <StatCard
          href="/dashboard/admin/campaigns?status=CHANGES_REQUESTED"
          icon={MessageSquareWarning}
          label="Changes requested"
          value={changesRequested}
          description="Sent back to the brand for edits."
        />
        <StatCard
          href="/dashboard/admin/campaigns?status=REJECTED"
          icon={XCircle}
          label="Rejected"
          value={rejected}
          description="Turned down, terminal."
        />
      </div>
    </DashboardShell>
  );
}
