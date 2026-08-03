import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { CreatorProfileCard } from "../../../_components/creator-profile-card";
import { ApplicationStatusBadge } from "../../../_components/status-badge";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function BrandCreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("BRAND");
  const { id } = await params;

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const creator = await prisma.creatorProfile.findUnique({ where: { id } });
  if (!creator) {
    notFound();
  }

  const applicationsToYourCampaigns = brandProfile
    ? await prisma.application.findMany({
        where: { creatorId: creator.id, campaign: { brandId: brandProfile.id } },
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { id: true, title: true } } },
      })
    : [];

  return (
    <DashboardShell role="Brand" name={brandProfile?.name}>
      <BackLink href="/dashboard/brand/creators" label="Back to creators" />

      <CreatorProfileCard
        name={creator.name}
        instagramHandle={creator.instagramHandle}
        category={creator.contentCategory}
        city={creator.city}
        followerCount={creator.followerCount}
        bio={creator.bio}
      >
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
            Applications to your campaigns
          </h2>
          {applicationsToYourCampaigns.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">
              This creator hasn&apos;t applied to any of your campaigns yet.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {applicationsToYourCampaigns.map((application) => (
                <Link
                  key={application.id}
                  href={`/dashboard/brand/campaigns/${application.campaign.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:border-orange-200 hover:bg-orange-50/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{application.campaign.title}</p>
                    <p className="text-xs text-gray-500">
                      Applied {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </CreatorProfileCard>
    </DashboardShell>
  );
}
