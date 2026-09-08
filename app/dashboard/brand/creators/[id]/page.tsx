import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { ProfileCardShell } from "../../../_components/profile-card-shell";
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

      <ProfileCardShell
        name={creator.name}
        handle={creator.instagramHandle}
        photoUrl={creator.instagramProfilePictureUrl ?? creator.avatarUrl}
        verified={Boolean(creator.instagramConnectedAt)}
        category={creator.contentCategory}
        city={creator.city}
        followerCount={creator.followerCount}
        bio={creator.bio}
      >
        <div>
          <h2 className="text-xs font-semibold text-muted">
            Applications to your campaigns
          </h2>
          {applicationsToYourCampaigns.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              This creator hasn&apos;t applied to any of your campaigns yet.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {applicationsToYourCampaigns.map((application) => (
                <Link
                  key={application.id}
                  href={`/dashboard/brand/campaigns/${application.campaign.id}`}
                  className="flex items-center justify-between gap-3 rounded-inset border border-line px-4 py-3 transition-colors hover:border-ember/25 hover:bg-ember-tint"
                >
                  <div>
                    <p className="text-sm font-medium text-strong">{application.campaign.title}</p>
                    <p className="text-xs text-muted">
                      Applied {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </ProfileCardShell>
    </DashboardShell>
  );
}
