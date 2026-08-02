import { AtSign, Tag, MapPin, Phone, Users, Megaphone, Wallet, MessageSquare } from "lucide-react";
import { DashboardShell } from "../_components/dashboard-shell";
import { EmptyStateCard } from "../_components/empty-state-card";
import { StatCard } from "../_components/stat-card";
import { ProfileCard } from "../_components/profile-card";
import { LinkButton } from "@/app/_components/ui/button";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel } from "@/lib/format";

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
      phone: true,
      followerCount: true,
    },
  });

  const [openCampaigns, myApplications] = profile
    ? await Promise.all([
        prisma.campaign.count({ where: { status: "OPEN", category: profile.contentCategory } }),
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
        <ProfileCard
          title="Your creator profile"
          fields={[
            { label: "Instagram", value: profile.instagramHandle, icon: AtSign },
            { label: "Category", value: formatEnumLabel(profile.contentCategory), icon: Tag },
            { label: "City", value: profile.city, icon: MapPin },
            { label: "Phone", value: profile.phone, icon: Phone },
            ...(profile.followerCount != null
              ? [
                  {
                    label: "Followers",
                    value: new Intl.NumberFormat("en-US", { notation: "compact" }).format(
                      profile.followerCount,
                    ),
                    icon: Users,
                  },
                ]
              : []),
          ]}
        />
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
