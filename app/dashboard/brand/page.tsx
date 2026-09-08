import { Building2, Globe, MapPin, Tag, Megaphone, Users, BarChart3 } from "lucide-react";
import { DashboardShell } from "../_components/dashboard-shell";
import { EmptyStateCard } from "../_components/empty-state-card";
import { StatCard } from "../_components/stat-card";
import { ProfileCard } from "../_components/profile-card";
import { LinkButton } from "@/app/_components/ui/button";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function BrandDashboardPage() {
  const session = await requireRole("BRAND");

  const profile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      companyName: true,
      industryCategory: true,
      city: true,
      companyWebsite: true,
    },
  });

  const [liveCampaigns, pendingReviewCampaigns, pendingApplications] = profile
    ? await Promise.all([
        prisma.campaign.count({ where: { brandId: profile.id, status: "APPROVED" } }),
        prisma.campaign.count({ where: { brandId: profile.id, status: "PENDING_REVIEW" } }),
        prisma.application.count({
          where: { status: { in: ["APPLIED", "CREATOR_COUNTERED"] }, campaign: { brandId: profile.id } },
        }),
      ])
    : [0, 0, 0];

  return (
    <DashboardShell role="Brand" name={profile?.name}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-strong">
            Welcome{profile?.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here&apos;s an overview of your brand account on Influnz.
          </p>
        </div>
        <div className="flex gap-3">
          <LinkButton href="/dashboard/brand/creators" variant="outline" size="sm">
            Browse creators
          </LinkButton>
          <LinkButton href="/dashboard/brand/campaigns/new" size="sm">
            New campaign
          </LinkButton>
        </div>
      </div>

      {profile && (
        <ProfileCard
          title="Your brand profile"
          fields={[
            { label: "Company", value: profile.companyName, icon: Building2 },
            { label: "Industry", value: profile.industryCategory, icon: Tag },
            { label: "City", value: profile.city, icon: MapPin },
            { label: "Website", value: profile.companyWebsite, icon: Globe },
          ]}
        />
      )}

      <div>
        <h2 className="text-sm font-semibold text-strong">What&apos;s next</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            href="/dashboard/brand/campaigns"
            icon={Megaphone}
            label="Campaigns"
            value={liveCampaigns}
            description={
              pendingReviewCampaigns > 0
                ? `Live campaigns. ${pendingReviewCampaigns} awaiting admin review.`
                : "Live campaigns creators can discover and apply to."
            }
          />
          <StatCard
            href="/dashboard/brand/campaigns"
            icon={Users}
            label="Applications"
            value={pendingApplications}
            description="Creator applications waiting on your response."
          />
          <EmptyStateCard
            icon={BarChart3}
            title="Analytics"
            description="Track reach, engagement, and payouts across every collaboration."
          />
        </div>
      </div>
    </DashboardShell>
  );
}
