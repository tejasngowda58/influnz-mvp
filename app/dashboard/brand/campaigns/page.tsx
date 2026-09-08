import Link from "next/link";
import type { CampaignStatus } from "@prisma/client";
import { Megaphone } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { CampaignCard } from "../../_components/campaign-card";
import { EmptyState } from "../../_components/empty-state";
import { BackLink } from "../../_components/back-link";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/app/_components/ui/button";

/** Campaigns that are finished with, as opposed to still in play. */
const HISTORY_STATUSES: CampaignStatus[] = ["CLOSED", "REJECTED"];

const VIEWS = [
  { label: "Active", value: "active" },
  { label: "History", value: "history" },
] as const;

export default async function BrandCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireRole("BRAND");
  const { view } = await searchParams;
  const activeView = view === "history" ? "history" : "active";

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const campaigns = brandProfile
    ? await prisma.campaign.findMany({
        where: {
          brandId: brandProfile.id,
          status: activeView === "history" ? { in: HISTORY_STATUSES } : { notIn: HISTORY_STATUSES },
        },
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
            <h1 className="text-2xl font-semibold text-strong">Your campaigns</h1>
            <p className="mt-1 text-sm text-muted">
              Post campaigns for creators to discover and apply to.
            </p>
          </div>
          <LinkButton href="/dashboard/brand/campaigns/new">New campaign</LinkButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/brand/campaigns?view=${tab.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeView === tab.value
                ? "bg-ember text-white"
                : "border border-line-strong bg-white text-muted hover:bg-paper"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={activeView === "history" ? "No campaign history yet" : "No campaigns yet"}
          body={
            activeView === "history"
              ? "Campaigns land here once they close — either because you filled every slot or because they were turned down at review."
              : "Post a campaign and an Influnz admin reviews it before any creator sees it. Once it is live, creators apply and you negotiate from your dashboard."
          }
          action={
            activeView === "active"
              ? { label: "New campaign", href: "/dashboard/brand/campaigns/new" }
              : undefined
          }
        />
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
