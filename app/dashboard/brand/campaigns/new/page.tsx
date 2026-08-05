import { DashboardShell } from "../../../_components/dashboard-shell";
import { BackLink } from "../../../_components/back-link";
import { CampaignForm } from "../_components/campaign-form";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function NewCampaignPage() {
  const session = await requireRole("BRAND");

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });

  return (
    <DashboardShell role="Brand" name={brandProfile?.name}>
      <div className="mx-auto w-full max-w-2xl">
        <BackLink href="/dashboard/brand/campaigns" label="Back to campaigns" />
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">New campaign</h1>
        <p className="mt-1 text-sm text-gray-600">
          Describe the collaboration you&apos;re looking for. An admin reviews every campaign
          before it goes live for creators.
        </p>
        <div className="mt-6">
          <CampaignForm />
        </div>
      </div>
    </DashboardShell>
  );
}
