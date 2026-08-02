import { Megaphone } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { CampaignCard } from "../../_components/campaign-card";
import { BackLink } from "../../_components/back-link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/app/_components/ui/button";

export default async function BrandCampaignsPage() {
  const session = await requireRole("BRAND");

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const campaigns = brandProfile
    ? await prisma.campaign.findMany({
        where: { brandId: brandProfile.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { applications: true } } },
      })
    : [];

  return (
    <DashboardShell role="Brand" name={brandProfile?.name}>
      <div className="flex flex-col gap-4">
        <BackLink href="/dashboard/brand" label="Back to dashboard" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your campaigns</h1>
            <p className="mt-1 text-sm text-gray-600">
              Post campaigns for creators to discover and apply to.
            </p>
          </div>
          <LinkButton href="/dashboard/brand/campaigns/new">New campaign</LinkButton>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Megaphone className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-gray-900">No campaigns yet</p>
          <p className="max-w-sm text-sm text-gray-600">
            Create your first campaign so creators can find and apply to it.
          </p>
          <LinkButton href="/dashboard/brand/campaigns/new" className="mt-2">
            New campaign
          </LinkButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              href={`/dashboard/brand/campaigns/${campaign.id}`}
              title={campaign.title}
              category={campaign.category}
              city={campaign.city}
              budget={campaign.budget}
              deadline={campaign.deadline}
              status={campaign.status}
              applicantCount={campaign._count.applications}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
