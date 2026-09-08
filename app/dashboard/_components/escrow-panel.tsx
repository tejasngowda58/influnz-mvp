import Link from "next/link";
import type { ApplicationStatus, EscrowStatus } from "@prisma/client";
import { AlertTriangle, BanknoteArrowUp, Clock, FileText, Lock, ShieldCheck } from "lucide-react";
import { LIVE_DEAL_STATUSES } from "@/lib/application-status";
import { formatPaise, paiseToRupees } from "@/lib/money";
import { AUTO_RELEASE_DAYS } from "@/lib/escrow";
import { FundEscrowButton } from "./fund-escrow-button";
import { RaiseDisputeDialog } from "./raise-dispute-dialog";

export interface EscrowPanelEscrow {
  status: EscrowStatus;
  amount: number;
  platformFee: number;
  releasedAmount: number | null;
  refundedAmount: number | null;
}

interface EscrowPanelProps {
  applicationId: string;
  viewerRole: "BRAND" | "CREATOR";
  applicationStatus: ApplicationStatus;
  escrow: EscrowPanelEscrow | null;
  contentSubmittedAt: Date | null;
  hasOpenDispute: boolean;
  paymentsEnabled: boolean;
}

type Tone = "neutral" | "action" | "secured" | "warning" | "done";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-line-strong bg-paper text-muted",
  action: "border-ember/25 bg-ember-tint text-strong",
  secured: "border-held/25 bg-held/5 text-strong",
  warning: "border-frozen/25 bg-frozen/5 text-strong",
  done: "border-settled/25 bg-settled/5 text-strong",
};

const ICON_CLASSES: Record<Tone, string> = {
  neutral: "bg-strong/[0.06] text-muted",
  action: "bg-ember-tint text-ember",
  secured: "bg-held/10 text-held",
  warning: "bg-frozen/10 text-frozen",
  done: "bg-settled/10 text-settled",
};

function Shell({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: Tone;
  icon: typeof Lock;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex gap-3 rounded-inset border p-4 ${TONE_CLASSES[tone]}`}>
      <span
        className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-inset ${ICON_CLASSES[tone]}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm font-semibold">{title}</p>
        {children}
      </div>
    </div>
  );
}

function daysUntilAutoRelease(contentSubmittedAt: Date): number {
  const elapsedDays = (Date.now() - contentSubmittedAt.getTime()) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(AUTO_RELEASE_DAYS - elapsedDays));
}

function AgreementLink({ applicationId }: { applicationId: string }) {
  return (
    <Link
      href={`/dashboard/contracts/${applicationId}`}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted underline underline-offset-2 hover:text-strong"
    >
      <FileText className="h-3 w-3" strokeWidth={2} />
      View the agreement
    </Link>
  );
}

/**
 * The money half of a deal, shown to both sides.
 *
 * The creator's copy is deliberately blunt about whether to start working:
 * "money is held" is the entire promise of the platform, and it is the one
 * thing a DM cannot offer.
 */
export function EscrowPanel({
  applicationId,
  viewerRole,
  applicationStatus,
  escrow,
  contentSubmittedAt,
  hasOpenDispute,
  paymentsEnabled,
}: EscrowPanelProps) {
  const isBrand = viewerRole === "BRAND";
  const showAgreement = LIVE_DEAL_STATUSES.includes(applicationStatus);

  if (hasOpenDispute) {
    return (
      <Shell tone="warning" icon={AlertTriangle} title="Disputed — money frozen">
        <p className="text-xs">
          {escrow ? `${formatPaise(escrow.amount)} stays held` : "The held amount stays put"} until an
          admin reviews both sides. Nothing is released or refunded in the meantime.
        </p>
      </Shell>
    );
  }

  // Before terms are agreed there is nothing to fund.
  if (!escrow || escrow.status === "PENDING") {
    if (applicationStatus !== "CONFIRMED") {
      return null;
    }

    if (!isBrand) {
      return (
        <Shell tone="neutral" icon={Clock} title="Waiting for the brand to fund escrow">
          <p className="text-xs">
            Don&apos;t start work yet. You&apos;ll be notified the moment the money is held by
            Influnz — that&apos;s your signal to begin.
          </p>
          {showAgreement && <AgreementLink applicationId={applicationId} />}
        </Shell>
      );
    }

    const amount = escrow?.amount ?? null;
    return (
      <Shell tone="action" icon={Lock} title="Fund escrow so the creator can start">
        <p className="text-xs">
          {amount
            ? `${formatPaise(amount)} will be held by Influnz`
            : "The agreed amount will be held by Influnz"}{" "}
          and released to the creator when you approve their content. They won&apos;t begin until
          it&apos;s funded.
        </p>
        {showAgreement && <AgreementLink applicationId={applicationId} />}
        {paymentsEnabled ? (
          <div className="mt-1">
            <FundEscrowButton applicationId={applicationId} />
          </div>
        ) : (
          <p className="mt-1 text-xs font-medium text-ember-dark">
            Payments aren&apos;t configured on this environment yet.
          </p>
        )}
      </Shell>
    );
  }

  if (escrow.status === "FUNDED") {
    const daysLeft = contentSubmittedAt ? daysUntilAutoRelease(contentSubmittedAt) : null;

    if (!isBrand) {
      return (
        <Shell tone="secured" icon={ShieldCheck} title={`${formatPaise(escrow.amount)} is secured in escrow`}>
          <p className="text-xs">
            {applicationStatus === "CONTENT_SUBMITTED"
              ? `Your content is with the brand. If they don't respond, the money releases to you automatically${daysLeft != null ? ` in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : ""}.`
              : "The brand has paid up front. You're safe to start work — the money is released to you once your content is approved."}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-3">
            <RaiseDisputeDialog applicationId={applicationId} />
            {showAgreement && <AgreementLink applicationId={applicationId} />}
          </div>
        </Shell>
      );
    }

    return (
      <Shell tone="secured" icon={Lock} title={`${formatPaise(escrow.amount)} held in escrow`}>
        <p className="text-xs">
          {applicationStatus === "CONTENT_SUBMITTED"
            ? `Review the content and approve to release payment. If you don't act, it releases automatically${daysLeft != null ? ` in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : ""}.`
            : "Released to the creator when you approve their content. Your money stays with Influnz until then."}
        </p>
        <p className="text-xs opacity-80">
          Includes a {formatPaise(escrow.platformFee)} platform fee (
          {Math.round((escrow.platformFee / Math.max(escrow.amount, 1)) * 100)}%), taken on release.
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-3">
          <RaiseDisputeDialog applicationId={applicationId} />
          {showAgreement && <AgreementLink applicationId={applicationId} />}
        </div>
      </Shell>
    );
  }

  if (escrow.status === "RELEASED") {
    const paid = escrow.releasedAmount ?? escrow.amount - escrow.platformFee;
    return (
      <Shell
        tone="done"
        icon={BanknoteArrowUp}
        title={isBrand ? "Payment released" : `${formatPaise(paid)} released to you`}
      >
        <p className="text-xs">
          {isBrand
            ? `${formatPaise(paid)} has been released to the creator and is queued for payout.`
            : `Queued for payout to your account. ${paiseToRupees(escrow.platformFee) > 0 ? `Influnz's ${formatPaise(escrow.platformFee)} fee has been deducted.` : ""}`}
        </p>
      </Shell>
    );
  }

  if (escrow.status === "REFUNDED") {
    const refunded = escrow.refundedAmount ?? escrow.amount;
    return (
      <Shell tone="neutral" icon={AlertTriangle} title="Escrow refunded">
        <p className="text-xs">
          {formatPaise(refunded)} went back to the brand
          {isBrand ? "" : " following a dispute decision"}.
        </p>
      </Shell>
    );
  }

  return (
    <Shell tone="warning" icon={AlertTriangle} title="Disputed — money frozen">
      <p className="text-xs">{formatPaise(escrow.amount)} stays held pending an admin decision.</p>
    </Shell>
  );
}
