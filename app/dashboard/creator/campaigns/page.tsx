import type { ContentCategory } from "@prisma/client";
import { Megaphone } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { BackLink } from "../../_components/back-link";
import { FilterBar } from "../../_components/filter-bar";
import { CampaignCard } from "../../_components/campaign-card";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function BrowseCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; search?: string }>;
}) {
  const session = await requireRole("CREATOR");
  const { category, city, search } = await searchParams;

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "APPROVED",
      ...(category ? { category: category as ContentCategory } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { brand: { companyName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { brand: { select: { companyName: true } } },
  });

  return (
    <DashboardShell role="Creator" name={creatorProfile?.name}>
      <div className="flex flex-col gap-4">
        <BackLink href="/dashboard/creator" label="Back to dashboard" />
        <h1 className="text-2xl font-semibold text-strong">Open campaigns</h1>
        <p className="mt-1 text-sm text-muted">
          Search by campaign or brand name, and browse paid collaborations to apply to.
        </p>
      </div>

      <FilterBar
        action="/dashboard/creator/campaigns"
        category={category}
        city={city}
        search={search}
        searchLabel="Search campaigns"
        searchPlaceholder="Campaign or brand name"
      />

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-surface border border-dashed border-line-strong py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-tint text-ember">
            <Megaphone className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-strong">No open campaigns match those filters</p>
          <p className="max-w-sm text-sm text-muted">Try a different search, category, or city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              href={`/dashboard/creator/campaigns/${campaign.id}`}
              title={campaign.title}
              brandName={campaign.brand.companyName}
              category={campaign.category}
              city={campaign.city}
              budget={campaign.budget}
              deadline={campaign.deadline}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
