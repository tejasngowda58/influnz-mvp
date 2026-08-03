"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
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
  const [loading, setLoading] = useState(false);

  const turn = NEGOTIATION_TURN[status];
  const isMyTurn = turn === viewerRole;
  const actions = (NEGOTIATION_ACTIONS[status] ?? []).filter(
    (action) => action !== "COUNTER" || campaignNegotiable,
  );

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setShowCounterForm(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    } finally {
      setLoading(false);
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
    patch({
      action: "COUNTER",
      proposedBudget: budgetNumber,
      proposedDeliverables: counterDeliverables.trim(),
      negotiationMessage: counterMessage.trim() || undefined,
    });
  }

  const isNegotiating = status === "APPLIED" || status === "BRAND_COUNTERED" || status === "CREATOR_COUNTERED";

  const termsSummary = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
      <span className="font-semibold text-gray-900">{formatBudget(proposedBudget)}</span>
      <span>{proposedDeliverables}</span>
      {isNegotiating && (
        <span className="text-xs text-gray-400">
          Round {round} of {MAX_NEGOTIATION_ROUNDS + 1} · last offered by{" "}
          {lastOfferBy === "CREATOR" ? "creator" : "brand"}
        </span>
      )}
    </div>
  );

  // Post-negotiation, simple forward-only pipeline (Confirmed -> Content Submitted -> Approved), brand-only.
  if (status === "CONFIRMED" || status === "CONTENT_SUBMITTED") {
    const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];
    if (viewerRole !== "BRAND" || nextStatuses.length === 0) {
      return (
        <div className="flex flex-col gap-2">
          {termsSummary}
          <p className="text-sm text-gray-500">
            {status === "CONFIRMED" ? "Terms agreed — awaiting content." : "Content submitted, awaiting approval."}
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
              <Button
                key={nextStatus}
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => patch({ status: nextStatus })}
              >
                {STATUS_ACTION_LABELS[nextStatus]}
              </Button>
            ))}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  if (status === "APPROVED" || status === "REJECTED") {
    return (
      <div className="flex flex-col gap-2">
        {termsSummary}
        <p className="text-sm text-gray-500">
          {status === "APPROVED" ? "Collaboration approved." : "This application was declined."}
        </p>
      </div>
    );
  }

  // Negotiation phase.
  return (
    <div className="flex flex-col gap-3">
      {termsSummary}

      {!isMyTurn && (
        <p className="text-sm text-gray-500">
          Waiting for the {viewerRole === "BRAND" ? "creator" : "brand"} to respond.
        </p>
      )}

      {isMyTurn && !showCounterForm && (
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {actions.includes("ACCEPT") && (
              <Button type="button" size="sm" disabled={loading} onClick={() => patch({ action: "ACCEPT" })}>
                Accept
              </Button>
            )}
            {actions.includes("COUNTER") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => setShowCounterForm(true)}
              >
                Counter
              </Button>
            )}
            {actions.includes("DECLINE") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => patch({ action: "DECLINE" })}
              >
                Decline
              </Button>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}

      {isMyTurn && showCounterForm && (
        <form onSubmit={submitCounter} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4">
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCounterForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Sending..." : "Send counter-offer"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
