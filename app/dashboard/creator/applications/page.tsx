import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { BackLink } from "../../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { ApplicationStatusBadge } from "../../_components/status-badge";
import { MetaRow } from "../../_components/meta-row";
import { EmptyState } from "../../_components/empty-state";
import { Badge } from "@/app/_components/ui/badge";
import { NEGOTIATION_TURN } from "@/lib/application-status";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate } from "@/lib/format";

export default async function CreatorApplicationsPage() {
  const session = await requireRole("CREATOR");

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const applications = creatorProfile
    ? await prisma.application.findMany({
        where: { creatorId: creatorProfile.id },
        orderBy: { createdAt: "desc" },
        include: { campaign: { include: { brand: { select: { companyName: true } } } } },
      })
    : [];

  return (
    <DashboardShell role="Creator" name={creatorProfile?.name}>
      <div className="flex flex-col gap-4">
        <BackLink href="/dashboard/creator" label="Back to dashboard" />
        <div>
          <h1 className="text-2xl font-semibold text-strong">Your applications</h1>
          <p className="mt-1 text-sm text-muted">
            Track the status of every campaign you&apos;ve applied to.
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No applications yet"
          body="Apply to a campaign and it shows up here, so you can follow it from offer through to payment without chasing anyone."
          action={{ label: "Browse open campaigns", href: "/dashboard/creator/campaigns" }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <Link key={application.id} href={`/dashboard/creator/campaigns/${application.campaign.id}`}>
              <Card className="flex items-center justify-between gap-4 p-5 transition-colors hover:border-line-strong">
                <div>
                  <p className="font-semibold text-strong">{application.campaign.title}</p>
                  <MetaRow
                    className="mt-2"
                    items={[
                      { label: "Brand", value: application.campaign.brand.companyName },
                      { label: "Agreed fee", value: formatBudget(application.proposedBudget) },
                      { label: "Applied", value: formatDate(application.createdAt) },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {NEGOTIATION_TURN[application.status] === "CREATOR" && (
                    <Badge tone="yours">Your turn</Badge>
                  )}
                  <ApplicationStatusBadge status={application.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
