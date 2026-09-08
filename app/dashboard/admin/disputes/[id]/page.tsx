import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Lock, User } from "lucide-react";
import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { ActivityTimeline } from "../../../_components/activity-timeline";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate, formatDateTime } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { ACTOR_DISPLAY_SELECT, resolveActorDisplayName } from "@/lib/activity-log";
import { DISPUTE_LABELS, DISPUTE_TONES } from "../page";
import { DisputeResolutionActions } from "./dispute-resolution-actions";

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      raisedBy: { select: ACTOR_DISPLAY_SELECT },
      resolvedBy: { select: { email: true } },
      application: {
        include: {
          escrow: true,
          contract: true,
          creator: true,
          campaign: { include: { brand: true } },
        },
      },
    },
  });

  if (!dispute) {
    notFound();
  }

  const { application } = dispute;

  // The evidence trail for this specific deal — this is what the audit log was for.
  const activities = await prisma.campaignActivity.findMany({
    where: { applicationId: application.id },
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

  const isSettled = dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW";

  return (
    <DashboardShell role="Admin">
      <BackLink href="/dashboard/admin/disputes" label="Back to disputes" />

      <Card className="flex flex-col gap-4 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-strong">{dispute.reason}</h1>
              <Badge tone={DISPUTE_TONES[dispute.status]}>{DISPUTE_LABELS[dispute.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              Raised by the {dispute.raisedByRole.toLowerCase()} (
              {resolveActorDisplayName(dispute.raisedBy)}) on {formatDateTime(dispute.createdAt)}
            </p>
          </div>
          {application.escrow && (
            <div className="text-right">
              <p className="text-xs font-medium text-muted">Held in escrow</p>
              <p className="text-xl font-semibold text-strong">
                {formatPaise(application.escrow.amount)}
              </p>
              <p className="text-xs text-muted">Escrow is {application.escrow.status.toLowerCase()}</p>
            </div>
          )}
        </div>

        <div className="rounded-inset border border-line bg-paper p-4">
          <h2 className="text-xs font-semibold text-muted">
            What they said
          </h2>
          <p className="mt-2 text-sm whitespace-pre-line text-strong">{dispute.description}</p>
          {dispute.evidence.length > 0 && (
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-muted">Evidence</h3>
              <ul className="mt-1 flex flex-col gap-1">
                {dispute.evidence.map((item) => (
                  <li key={item} className="text-sm break-all text-ember-dark underline">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {isSettled && dispute.resolution && (
          <div className="rounded-inset border border-settled/20 bg-settled/5 p-4">
            <h2 className="text-xs font-semibold text-settled">
              Decision
            </h2>
            <p className="mt-2 text-sm text-strong">{dispute.resolution}</p>
            <p className="mt-1 text-xs text-muted">
              {DISPUTE_LABELS[dispute.status]}
              {dispute.resolvedBy ? ` by ${dispute.resolvedBy.email}` : ""}
              {dispute.resolvedAt ? ` on ${formatDateTime(dispute.resolvedAt)}` : ""}
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-strong">
            <FileText className="h-4 w-4 text-muted" strokeWidth={1.75} />
            Agreed terms
          </h2>
          {application.contract ? (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Budget</dt>
                <dd className="font-medium text-strong">
                  {formatBudget(application.contract.budget)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Deadline</dt>
                <dd className="font-medium text-strong">
                  {formatDate(application.contract.deadline)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Deliverables</dt>
                <dd className="mt-1 text-strong">{application.contract.deliverables}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-2">
                <dt className="text-muted">Accepted</dt>
                <dd className="text-right text-xs text-muted">
                  Brand{" "}
                  {application.contract.brandAcceptedAt
                    ? formatDate(application.contract.brandAcceptedAt)
                    : "—"}
                  <br />
                  Creator{" "}
                  {application.contract.creatorAcceptedAt
                    ? formatDate(application.contract.creatorAcceptedAt)
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">
              This deal predates contract snapshots. Falling back to the live application terms:{" "}
              {formatBudget(application.proposedBudget)} for {application.proposedDeliverables}.
            </p>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-6">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-strong">
            <User className="h-4 w-4 text-muted" strokeWidth={1.75} />
            The parties
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Brand</p>
              <p className="font-medium text-strong">{application.campaign.brand.companyName}</p>
              <p className="text-muted">{application.campaign.brand.workEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Creator</p>
              <Link
                href={`/dashboard/admin/campaigns/${application.campaignId}`}
                className="font-medium text-strong hover:text-ember-dark"
              >
                {application.creator.name}
              </Link>
              <p className="text-muted">
                {application.creator.instagramHandle
                  ? `@${application.creator.instagramHandle.replace(/^@/, "")}`
                  : "Instagram not connected"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Campaign</p>
              <Link
                href={`/dashboard/admin/campaigns/${application.campaignId}`}
                className="font-medium text-strong hover:text-ember-dark"
              >
                {application.campaign.title}
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {!isSettled && application.escrow && (
        <Card className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-strong">
              <Lock className="h-4 w-4 text-muted" strokeWidth={1.75} />
              Settle {formatPaise(application.escrow.amount)}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Releasing pays the creator, refunding returns the money to the brand, and a split does
              both. Whichever you pick is final and recorded.
            </p>
          </div>
          <DisputeResolutionActions
            disputeId={dispute.id}
            escrowAmount={application.escrow.amount}
            escrowAmountLabel={formatPaise(application.escrow.amount)}
          />
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-strong">Evidence trail for this deal</h2>
        <p className="mt-1 text-sm text-muted">
          Every recorded action on this application, oldest first.
        </p>
        <div className="mt-4">
          <ActivityTimeline entries={timelineEntries} />
        </div>
      </Card>
    </DashboardShell>
  );
}
