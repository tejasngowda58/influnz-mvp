import { Megaphone, Wallet, MessageSquare } from "lucide-react";
import { DashboardShell } from "../_components/dashboard-shell";
import { EmptyStateCard } from "../_components/empty-state-card";
import { StatCard } from "../_components/stat-card";
import { CreatorProfileCard } from "../_components/creator-profile-card";
import { Card } from "@/app/_components/ui/card";
import { LinkButton } from "@/app/_components/ui/button";
import { EditProfileForm } from "./edit-profile-form";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function CreatorDashboardPage() {
  const session = await requireRole("CREATOR");

  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      instagramHandle: true,
      contentCategory: true,
      city: true,
      followerCount: true,
      bio: true,
    },
  });

  const [openCampaigns, myApplications] = profile
    ? await Promise.all([
        prisma.campaign.count({ where: { status: "APPROVED", category: profile.contentCategory } }),
        prisma.application.count({ where: { creatorId: profile.id } }),
      ])
    : [0, 0];

  return (
    <DashboardShell role="Creator" name={profile?.name}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome{profile?.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here&apos;s an overview of your creator account on Influnz.
          </p>
        </div>
        <LinkButton href="/dashboard/creator/campaigns" size="sm">
          Browse campaigns
        </LinkButton>
      </div>

      {profile && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              How brands see your profile
            </h2>
            <CreatorProfileCard
              name={profile.name}
              instagramHandle={profile.instagramHandle}
              category={profile.contentCategory}
              city={profile.city}
              followerCount={profile.followerCount}
              bio={profile.bio}
            />
          </div>
          <Card className="h-fit p-6">
            <h2 className="text-sm font-semibold text-gray-900">Edit your profile</h2>
            <p className="mt-1 text-sm text-gray-600">
              Add a bio and keep your follower count up to date so brands know who they&apos;re
              shortlisting.
            </p>
            <div className="mt-4">
              <EditProfileForm
                bio={profile.bio ?? ""}
                followerCount={profile.followerCount != null ? String(profile.followerCount) : ""}
              />
            </div>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-900">What&apos;s next</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            href="/dashboard/creator/campaigns"
            icon={Megaphone}
            label="Campaigns"
            value={openCampaigns}
            description="Open campaigns in your category, ready to apply to."
          />
          <StatCard
            href="/dashboard/creator/applications"
            icon={MessageSquare}
            label="Applications"
            value={myApplications}
            description="Campaigns you've applied to and their current status."
          />
          <EmptyStateCard
            icon={Wallet}
            title="Earnings"
            description="Track payouts and pending payments from your collaborations."
          />
        </div>
      </div>
    </DashboardShell>
  );
}
