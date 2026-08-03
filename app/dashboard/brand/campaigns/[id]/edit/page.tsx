import { notFound } from "next/navigation";
import { DashboardShell } from "../../../../_components/dashboard-shell";
import { BackLink } from "../../../../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { CampaignForm } from "../../_components/campaign-form";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("BRAND");
  const { id } = await params;

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });

  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.user.id } },
  });

  if (!campaign || campaign.status !== "CHANGES_REQUESTED") {
    notFound();
  }

  return (
    <DashboardShell role="Brand" name={brandProfile?.name}>
      <div className="mx-auto w-full max-w-2xl">
        <BackLink href={`/dashboard/brand/campaigns/${campaign.id}`} label="Back to campaign" />
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Edit &amp; resubmit</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the campaign based on the admin&apos;s feedback below, then resubmit for review.
        </p>

        {campaign.adminComment && (
          <Card className="mt-4 border-orange-100 bg-orange-50/50 p-4">
            <h2 className="text-xs font-medium tracking-wide text-orange-600 uppercase">
              Admin feedback
            </h2>
            <p className="mt-1 text-sm text-gray-700">{campaign.adminComment}</p>
          </Card>
        )}

        <div className="mt-6">
          <CampaignForm
            campaignId={campaign.id}
            initialValues={{
              title: campaign.title,
              description: campaign.description,
              category: campaign.category,
              city: campaign.city ?? "",
              budget: String(campaign.budget),
              deliverables: campaign.deliverables,
              targetAudience: campaign.targetAudience ?? "",
              deadline: campaign.deadline.toISOString().slice(0, 10),
              negotiable: campaign.negotiable,
            }}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
