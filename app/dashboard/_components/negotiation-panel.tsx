"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
import { ArrowRight, Bell, Clock, Loader2 } from "lucide-react";
import { Field, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";
import {
  ALLOWED_TRANSITIONS,
  MAX_NEGOTIATION_ROUNDS,
  NEGOTIATION_ACTIONS,
  NEGOTIATION_TURN,
  STATUS_ACTION_LABELS,
  type NegotiationActor,
} from "@/lib/application-status";
import { formatBudget, formatDateTime } from "@/lib/format";
import type { OfferHistoryEntry } from "@/lib/offer-history";

interface NegotiationPanelProps {
  applicationId: string;
  status: ApplicationStatus;
  viewerRole: NegotiationActor;
  campaignNegotiable: boolean;
  proposedBudget: number;
  proposedDeliverables: string;
  negotiationMessage?: string | null;
  round: number;
  lastOfferBy: NegotiationActor;
  brandName: string;
  creatorName: string;
  history?: OfferHistoryEntry[];
}

function ActionButton({
  actionKey,
  variant,
  loading,
  onClick,
  children,
}: {
  actionKey: string;
  variant: "primary" | "outline" | "danger";
  loading: string | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant={variant} size="sm" disabled={loading !== null} onClick={onClick}>
      {loading === actionKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </Button>
  );
}

/** One of the two parties, flanking the offer on the table. */
function Party({
  name,
  role,
  isOfferer,
  align,
}: {
  name: string;
  role: string;
  isOfferer: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 ${align === "right" ? "sm:items-end sm:text-right" : ""}`}
    >
      <p className="truncate text-sm font-semibold text-strong">{name}</p>
      <p className="text-xs text-muted">{role}</p>
      {isOfferer && <p className="text-micro font-semibold text-ember">their offer stands</p>}
    </div>
  );
}

/**
 * The emotional centre of the product: two parties, money on the table, a
 * visible turn, and a hard limit on how long this can go on. Everything
 * around it in the dashboard stays deliberately quiet.
 */
export function NegotiationPanel({
  applicationId,
  status,
  viewerRole,
  campaignNegotiable,
  proposedBudget,
  proposedDeliverables,
  negotiationMessage,
  round,
  lastOfferBy,
  brandName,
  creatorName,
  history = [],
}: NegotiationPanelProps) {
  const router = useRouter();
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [counterBudget, setCounterBudget] = useState(String(proposedBudget));
  const [counterDeliverables, setCounterDeliverables] = useState(proposedDeliverables);
  const [counterMessage, setCounterMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const turn = NEGOTIATION_TURN[status];
  const isMyTurn = turn === viewerRole;
  const isNegotiating = Boolean(turn);
  const actions = (NEGOTIATION_ACTIONS[status] ?? []).filter(
    (action) => action !== "COUNTER" || campaignNegotiable,
  );
  const countersLeft = MAX_NEGOTIATION_ROUNDS + 1 - round;

  async function patch(key: string, body: Record<string, unknown>) {
    setError(null);
    setLoading(key);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(null);
        return;
      }
      setShowCounterForm(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  function submitCounter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const budgetNumber = Number(counterBudget);
    if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
      setError("Enter a valid budget");
      return;
    }
    if (!counterDeliverables.trim()) {
      setError("Deliverables can't be empty");
      return;
    }
    patch("COUNTER", {
      action: "COUNTER",
      proposedBudget: budgetNumber,
      proposedDeliverables: counterDeliverables.trim(),
      negotiationMessage: counterMessage.trim() || undefined,
    });
  }

  const historyList = history.length > 0 && (
    <div className="border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setShowHistory((previous) => !previous)}
        className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-strong"
      >
        {showHistory ? "Hide history" : `How this got to ${formatBudget(proposedBudget)}`}
      </button>
      {showHistory && (
        <ol className="mt-3 flex flex-col gap-2">
          {history.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-semibold text-strong">
                {entry.actorRole === "BRAND"
                  ? brandName
                  : entry.actorRole === "CREATOR"
                    ? creatorName
                    : "Admin"}
              </span>
              <span className="text-muted">{entry.text}</span>
              <span className="ml-auto text-muted/70">{formatDateTime(entry.at)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  // ---- settled or terminal: a compact record, no theatre ----------------
  if (!isNegotiating) {
    const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];
    const canAdvance = viewerRole === "BRAND" && nextStatuses.length > 0;

    const settledCopy =
      status === "REJECTED"
        ? "This application was declined."
        : status === "RELEASED"
          ? "Complete and paid out."
          : status === "APPROVED"
            ? "Approved — releasing payment."
            : status === "CONFIRMED"
              ? viewerRole === "BRAND"
                ? "Terms agreed. Fund escrow to start the work."
                : "Terms agreed. Waiting for the brand to fund escrow."
              : status === "FUNDED"
                ? "Funded — work in progress."
                : "Content submitted, awaiting the brand's review.";

    return (
      <div className="flex flex-col gap-3 rounded-card border border-line bg-paper p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-base font-semibold text-strong">{formatBudget(proposedBudget)}</p>
          <p className="text-xs text-muted">{settledCopy}</p>
        </div>
        <p className="text-sm text-muted">{proposedDeliverables}</p>

        {canAdvance && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              {nextStatuses.map((nextStatus) => (
                <ActionButton
                  key={nextStatus}
                  actionKey={nextStatus}
                  variant="outline"
                  loading={loading}
                  onClick={() => patch(nextStatus, { status: nextStatus })}
                >
                  {STATUS_ACTION_LABELS[nextStatus]}
                </ActionButton>
              ))}
            </div>
            {error && <p className="text-xs text-stopped">{error}</p>}
          </div>
        )}

        {historyList}
      </div>
    );
  }

  // ---- live negotiation ------------------------------------------------
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 ${
          isMyTurn ? "bg-ember text-white" : "bg-strong/4 text-muted"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          {isMyTurn ? <Bell className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {isMyTurn ? "Your move" : `Waiting on the ${viewerRole === "BRAND" ? "creator" : "brand"}`}
        </span>
        <span className={`text-xs font-medium ${isMyTurn ? "text-white/80" : "text-muted"}`}>
          Round {round} of {MAX_NEGOTIATION_ROUNDS + 1}
        </span>
      </div>

      <div className="flex flex-col gap-4 bg-surface p-5">
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <Party
            name={brandName}
            role={viewerRole === "BRAND" ? "Brand (you)" : "Brand"}
            isOfferer={lastOfferBy === "BRAND"}
            align="left"
          />

          <div className="rounded-inset border border-ember/25 bg-ember-tint px-5 py-3 text-center">
            <p className="text-xl font-bold text-strong">{formatBudget(proposedBudget)}</p>
            <p className="mt-0.5 text-xs text-muted">{proposedDeliverables}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-micro font-semibold text-ember">
              {lastOfferBy === "BRAND" ? (
                <>
                  brand offered
                  <ArrowRight className="h-2.5 w-2.5" strokeWidth={3} />
                </>
              ) : (
                <>
                  <ArrowRight className="h-2.5 w-2.5 rotate-180" strokeWidth={3} />
                  creator asked
                </>
              )}
            </p>
          </div>

          <Party
            name={creatorName}
            role={viewerRole === "CREATOR" ? "Creator (you)" : "Creator"}
            isOfferer={lastOfferBy === "CREATOR"}
            align="right"
          />
        </div>

        {negotiationMessage && (
          <p className="rounded-inset bg-paper px-4 py-3 text-sm text-strong">
            &ldquo;{negotiationMessage}&rdquo;
          </p>
        )}

        {isMyTurn && !showCounterForm && (
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <div className="flex flex-wrap gap-2">
              {actions.includes("ACCEPT") && (
                <ActionButton
                  actionKey="ACCEPT"
                  variant="primary"
                  loading={loading}
                  onClick={() => patch("ACCEPT", { action: "ACCEPT" })}
                >
                  Accept {formatBudget(proposedBudget)}
                </ActionButton>
              )}
              {actions.includes("COUNTER") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading !== null}
                  onClick={() => setShowCounterForm(true)}
                >
                  Counter
                </Button>
              )}
              {actions.includes("DECLINE") && (
                <ActionButton
                  actionKey="DECLINE"
                  variant="danger"
                  loading={loading}
                  onClick={() => patch("DECLINE", { action: "DECLINE" })}
                >
                  Decline
                </ActionButton>
              )}
            </div>
            <p className="text-xs text-muted">
              {actions.includes("COUNTER")
                ? `${countersLeft} counter${countersLeft === 1 ? "" : "s"} left before terms must be settled.`
                : "No counters left — accept these terms or walk away."}
            </p>
            {error && <p className="text-xs text-stopped">{error}</p>}
          </div>
        )}

        {isMyTurn && showCounterForm && (
          <form onSubmit={submitCounter} className="flex flex-col gap-3 border-t border-line pt-4">
            <p className="text-sm font-semibold text-strong">Propose different terms</p>
            <Field
              label="Your budget"
              id={`counter-budget-${applicationId}`}
              type="number"
              value={counterBudget}
              onChange={setCounterBudget}
            />
            <TextAreaField
              label="Your deliverables"
              id={`counter-deliverables-${applicationId}`}
              value={counterDeliverables}
              onChange={setCounterDeliverables}
              rows={2}
            />
            <TextAreaField
              label="Message (optional)"
              id={`counter-message-${applicationId}`}
              placeholder="Explain your counter-offer"
              value={counterMessage}
              onChange={setCounterMessage}
              rows={2}
            />
            {error && <p className="text-sm text-stopped">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCounterForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading !== null}>
                {loading === "COUNTER" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send counter-offer
              </Button>
            </div>
          </form>
        )}

        {!isMyTurn && (
          <p className="border-t border-line pt-4 text-sm text-muted">
            Nothing for you to do yet. You&apos;ll be notified when they respond.
          </p>
        )}

        {historyList}
      </div>
    </div>
  );
}
