import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { BackLink } from "../../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { ApplicationStatusBadge } from "../../_components/status-badge";
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
          <h1 className="text-2xl font-semibold text-gray-900">Your applications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track the status of every campaign you&apos;ve applied to.
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <MessageSquare className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-gray-900">No applications yet</p>
          <p className="max-w-sm text-sm text-gray-600">
            Browse open campaigns and apply to the ones that fit your content.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <Link key={application.id} href={`/dashboard/creator/campaigns/${application.campaign.id}`}>
              <Card className="flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-md">
                <div>
                  <p className="font-semibold text-gray-900">{application.campaign.title}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {application.campaign.brand.companyName} · {formatBudget(application.campaign.budget)} ·{" "}
                    Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <ApplicationStatusBadge status={application.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
