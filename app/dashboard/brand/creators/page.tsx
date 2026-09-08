import type { ContentCategory } from "@prisma/client";
import { Users } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { BackLink } from "../../_components/back-link";
import { FilterBar } from "../../_components/filter-bar";
import { CreatorCard } from "../../_components/creator-card";
import { EmptyState } from "../../_components/empty-state";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function CreatorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; search?: string }>;
}) {
  const session = await requireRole("BRAND");
  const { category, city, search } = await searchParams;

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });

  const creators = await prisma.creatorProfile.findMany({
    where: {
      ...(category ? { contentCategory: category as ContentCategory } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { instagramHandle: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardShell role="Brand" name={brandProfile?.name}>
      <div className="flex flex-col gap-4">
        <BackLink href="/dashboard/brand" label="Back to dashboard" />
        <h1 className="text-2xl font-semibold text-strong">Creator directory</h1>
        <p className="mt-1 text-sm text-muted">
          Search creators by name, handle, category, and city to find your next collaborator.
        </p>
      </div>

      <FilterBar
        action="/dashboard/brand/creators"
        category={category}
        city={city}
        search={search}
        searchLabel="Search creators"
        searchPlaceholder="Name or Instagram handle"
      />

      {creators.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No creators match those filters"
          body="Every creator here has an Influnz account, and verified ones have had their follower count pulled from Instagram directly. Widen the category or city to see more."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard
              key={creator.id}
              id={creator.id}
              name={creator.name}
              instagramHandle={creator.instagramHandle}
              photoUrl={creator.instagramProfilePictureUrl ?? creator.avatarUrl}
              verified={Boolean(creator.instagramConnectedAt)}
              category={creator.contentCategory}
              city={creator.city}
              followerCount={creator.followerCount}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
