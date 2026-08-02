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
  searchParams: Promise<{ category?: string; city?: string }>;
}) {
  const session = await requireRole("CREATOR");
  const { category, city } = await searchParams;

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "OPEN",
      ...(category ? { category: category as ContentCategory } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell role="Creator" name={creatorProfile?.name}>
      <div className="flex flex-col gap-4">
        <BackLink href="/dashboard/creator" label="Back to dashboard" />
        <h1 className="text-2xl font-semibold text-gray-900">Open campaigns</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse paid collaborations from brands and apply to the ones that fit.
        </p>
      </div>

      <FilterBar action="/dashboard/creator/campaigns" category={category} city={city} />

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Megaphone className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-gray-900">No open campaigns match those filters</p>
          <p className="max-w-sm text-sm text-gray-600">Try a different category or city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              href={`/dashboard/creator/campaigns/${campaign.id}`}
              title={campaign.title}
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
