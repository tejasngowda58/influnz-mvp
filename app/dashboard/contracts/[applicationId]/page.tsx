import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { DashboardShell } from "../../_components/dashboard-shell";
import { BackLink } from "../../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { requireSession } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatBudget, formatDate, formatDateTime } from "@/lib/format";
import { AcceptContractButton } from "./accept-contract-button";
import { PrintButton } from "./print-button";

/**
 * The frozen record of what was agreed. Both sides accept it with a timestamp;
 * that plus the audit log is what settles a later disagreement, which is why
 * this page shows the snapshot rather than the live campaign fields.
 */
export default async function ContractPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await requireSession();
  const { applicationId } = await params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      contract: true,
      creator: true,
      campaign: { include: { brand: true } },
    },
  });

  if (!application?.contract) {
    notFound();
  }

  const isBrandParty = application.campaign.brand.userId === session.user.id;
  const isCreatorParty = application.creator.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isBrandParty && !isCreatorParty && !isAdmin) {
    notFound();
  }

  const contract = application.contract;
  const myAcceptance = isBrandParty ? contract.brandAcceptedAt : contract.creatorAcceptedAt;
  const bothAccepted = Boolean(contract.brandAcceptedAt && contract.creatorAcceptedAt);

  const backHref = isBrandParty
    ? `/dashboard/brand/campaigns/${application.campaignId}`
    : isCreatorParty
      ? "/dashboard/creator/applications"
      : `/dashboard/admin/campaigns/${application.campaignId}`;

  return (
    <DashboardShell
      role={session.user.role === "CREATOR" ? "Creator" : session.user.role === "BRAND" ? "Brand" : "Admin"}
    >
      <div className="print:hidden">
        <BackLink href={backHref} label="Back" />
      </div>

      <Card className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-xs font-semibold text-ember-dark">
              Collaboration agreement
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-strong">{contract.campaignTitle}</h1>
            <p className="mt-1 text-sm text-muted">
              Agreed {formatDateTime(contract.createdAt)} — Influnz reference{" "}
              {contract.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="print:hidden">
            <PrintButton />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold text-muted">Brand</h2>
            <p className="mt-1 font-medium text-strong">{contract.brandCompanyName}</p>
            <p className="text-sm text-muted">{contract.brandName}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted">Creator</h2>
            <p className="mt-1 font-medium text-strong">{contract.creatorName}</p>
            <p className="text-sm text-muted">
              {contract.creatorHandle
                ? `@${contract.creatorHandle.replace(/^@/, "")}`
                : "Instagram not connected"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-5">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold text-muted">Fee</h2>
              <p className="mt-1 text-xl font-semibold text-strong">
                {formatBudget(contract.budget)}
              </p>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-muted">
                Delivery deadline
              </h2>
              <p className="mt-1 text-xl font-semibold text-strong">
                {formatDate(contract.deadline)}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-muted">
              Deliverables
            </h2>
            <p className="mt-1 text-sm whitespace-pre-line text-strong">{contract.deliverables}</p>
          </div>

          <div className="rounded-inset border border-line bg-paper p-4">
            <h2 className="text-xs font-semibold text-muted">
              How payment works
            </h2>
            <p className="mt-1 text-sm text-strong">
              The brand funds the full fee into Influnz escrow before work begins. The creator
              delivers the agreed content by the deadline. The money is released to the creator when
              the brand approves the content, and automatically if the brand does not respond within
              7 days of delivery. Either side can raise a dispute while the money is held, which
              freezes it until an Influnz admin decides.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2">
          {(
            [
              { label: "Brand accepted", at: contract.brandAcceptedAt, who: contract.brandCompanyName },
              { label: "Creator accepted", at: contract.creatorAcceptedAt, who: contract.creatorName },
            ] as const
          ).map((party) => (
            <div key={party.label} className="rounded-inset border border-line p-4">
              <h3 className="text-xs font-semibold text-muted">
                {party.label}
              </h3>
              {party.at ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-settled">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                  {formatDateTime(party.at)}
                </p>
              ) : (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                  <Clock className="h-4 w-4" strokeWidth={1.75} />
                  Not yet accepted
                </p>
              )}
              <p className="mt-1 text-xs text-muted">{party.who}</p>
            </div>
          ))}
        </div>

        {!isAdmin && !myAcceptance && (
          <div className="border-t border-line pt-5 print:hidden">
            <p className="mb-3 text-sm text-muted">
              Accepting records a timestamp against your name. These terms cannot be edited
              afterwards — a change means agreeing a new deal.
            </p>
            <AcceptContractButton applicationId={application.id} />
          </div>
        )}

        {bothAccepted && (
          <p className="border-t border-line pt-5 text-sm font-medium text-settled">
            Both parties have accepted these terms.
          </p>
        )}
      </Card>
    </DashboardShell>
  );
}
