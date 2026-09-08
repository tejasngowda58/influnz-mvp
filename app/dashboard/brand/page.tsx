import { Building2, Globe, MapPin, Tag, Megaphone, Users, BarChart3 } from "lucide-react";
import { DashboardShell } from "../_components/dashboard-shell";
import { EmptyStateCard } from "../_components/empty-state-card";
import { StatCard } from "../_components/stat-card";
import { ProfileCard } from "../_components/profile-card";
import { LinkButton } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
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

  const [liveCampaigns, pendingReviewCampaigns, pendingApplications, totalCampaigns] = profile
    ? await Promise.all([
        prisma.campaign.count({ where: { brandId: profile.id, status: "APPROVED" } }),
        prisma.campaign.count({ where: { brandId: profile.id, status: "PENDING_REVIEW" } }),
        prisma.application.count({
          where: { status: { in: ["APPLIED", "CREATOR_COUNTERED"] }, campaign: { brandId: profile.id } },
        }),
        prisma.campaign.count({ where: { brandId: profile.id } }),
      ])
    : [0, 0, 0, 0];

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

      {profile && totalCampaigns === 0 && (
        <Card radius="surface" className="flex flex-col gap-5 p-6">
          <div>
            <h2 className="font-display text-lg text-strong">How a campaign works here</h2>
            <p className="mt-1 text-sm text-muted">
              Four steps, and the money only moves at the last one.
            </p>
          </div>

          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Post a campaign",
                body: "Budget, deliverables, deadline, and how many creators you need.",
              },
              {
                title: "We review it",
                body: "An Influnz admin checks it before any creator sees it.",
              },
              {
                title: "Negotiate",
                body: "Creators apply and can counter. Two rounds, then terms settle.",
              },
              {
                title: "Fund escrow",
                body: "We hold the fee until you approve the work, so nobody works on a promise.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-ember/30 bg-ember-tint text-xs font-bold text-ember">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-strong">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div>
            <LinkButton href="/dashboard/brand/campaigns/new" size="sm">
              Post your first campaign
            </LinkButton>
          </div>
        </Card>
      )}

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
