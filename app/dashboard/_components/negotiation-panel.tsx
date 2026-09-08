"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
import { Bell, Clock, Loader2 } from "lucide-react";
import { Field, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import {
  ALLOWED_TRANSITIONS,
  MAX_NEGOTIATION_ROUNDS,
  NEGOTIATION_ACTIONS,
  NEGOTIATION_TURN,
  STATUS_ACTION_LABELS,
  type NegotiationActor,
} from "@/lib/application-status";
import { formatBudget } from "@/lib/format";

interface NegotiationPanelProps {
  applicationId: string;
  status: ApplicationStatus;
  viewerRole: NegotiationActor;
  campaignNegotiable: boolean;
  proposedBudget: number;
  proposedDeliverables: string;
  round: number;
  lastOfferBy: NegotiationActor;
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

export function NegotiationPanel({
  applicationId,
  status,
  viewerRole,
  campaignNegotiable,
  proposedBudget,
  proposedDeliverables,
  round,
  lastOfferBy,
}: NegotiationPanelProps) {
  const router = useRouter();
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterBudget, setCounterBudget] = useState(String(proposedBudget));
  const [counterDeliverables, setCounterDeliverables] = useState(proposedDeliverables);
  const [counterMessage, setCounterMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const turn = NEGOTIATION_TURN[status];
  const isMyTurn = turn === viewerRole;
  const actions = (NEGOTIATION_ACTIONS[status] ?? []).filter(
    (action) => action !== "COUNTER" || campaignNegotiable,
  );
  const isNegotiating = status === "APPLIED" || status === "BRAND_COUNTERED" || status === "CREATOR_COUNTERED";

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

  const termsSummary = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <span className="font-semibold text-strong">{formatBudget(proposedBudget)}</span>
      <span>{proposedDeliverables}</span>
    </div>
  );

  const turnBanner = isNegotiating && (
    <div
      className={`flex items-center justify-between gap-3 rounded-inset px-3 py-2 ${
        isMyTurn ? "bg-held/5" : "bg-paper"
      }`}
    >
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
          isMyTurn ? "text-held" : "text-muted"
        }`}
      >
        {isMyTurn ? <Bell className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        {isMyTurn ? "Your turn to respond" : `Waiting on ${viewerRole === "BRAND" ? "creator" : "brand"}`}
      </span>
      <Badge tone="neutral">
        Round {round} of {MAX_NEGOTIATION_ROUNDS + 1} · last offered by{" "}
        {lastOfferBy === "CREATOR" ? "creator" : "brand"}
      </Badge>
    </div>
  );

  // Post-negotiation pipeline. CONFIRMED has no manual action any more: escrow
  // funding is what moves a deal forward, so the panel just explains the wait.
  if (status === "CONFIRMED" || status === "FUNDED" || status === "CONTENT_SUBMITTED") {
    const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];
    if (viewerRole !== "BRAND" || nextStatuses.length === 0) {
      return (
        <div className="flex flex-col gap-2">
          {termsSummary}
          <p className="text-sm text-muted">
            {status === "CONFIRMED"
              ? viewerRole === "BRAND"
                ? "Terms agreed — fund escrow to start the work."
                : "Terms agreed — waiting for the brand to fund escrow."
              : status === "FUNDED"
                ? "Funded — work in progress."
                : "Content submitted, awaiting approval."}
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {termsSummary}
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
      </div>
    );
  }

  if (status === "APPROVED" || status === "RELEASED" || status === "REJECTED") {
    return (
      <div className="flex flex-col gap-2">
        {termsSummary}
        <p className="text-sm text-muted">
          {status === "REJECTED"
            ? "This application was declined."
            : status === "RELEASED"
              ? "Collaboration complete and paid out."
              : "Collaboration approved."}
        </p>
      </div>
    );
  }

  // Negotiation phase.
  return (
    <div className="flex flex-col gap-3">
      {turnBanner}
      {termsSummary}

      {isMyTurn && !showCounterForm && (
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {actions.includes("ACCEPT") && (
              <ActionButton
                actionKey="ACCEPT"
                variant="primary"
                loading={loading}
                onClick={() => patch("ACCEPT", { action: "ACCEPT" })}
              >
                Accept
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
          {error && <p className="text-xs text-stopped">{error}</p>}
        </div>
      )}

      {isMyTurn && showCounterForm && (
        <form
          onSubmit={submitCounter}
          className="flex flex-col gap-3 rounded-inset border border-ember/25 bg-ember-tint p-4"
        >
          <p className="text-xs font-medium text-ember-dark">Proposing new terms</p>
          <Field
            label="Your proposed budget"
            id={`counter-budget-${applicationId}`}
            type="number"
            value={counterBudget}
            onChange={setCounterBudget}
          />
          <TextAreaField
            label="Your proposed deliverables"
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
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCounterForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading !== null}>
              {loading === "COUNTER" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send counter-offer
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
