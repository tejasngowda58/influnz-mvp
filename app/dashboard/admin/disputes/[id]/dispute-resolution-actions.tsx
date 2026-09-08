"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Field, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";

type Decision = "UNDER_REVIEW" | "RESOLVED_CREATOR" | "RESOLVED_BRAND" | "SPLIT";

interface DisputeResolutionActionsProps {
  disputeId: string;
  /** Held amount in paise, used to bound the split. */
  escrowAmount: number;
  escrowAmountLabel: string;
}

export function DisputeResolutionActions({
  disputeId,
  escrowAmount,
  escrowAmountLabel,
}: DisputeResolutionActionsProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [resolution, setResolution] = useState("");
  const [creatorShareRupees, setCreatorShareRupees] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(chosen: Decision) {
    setError(null);

    if (chosen !== "UNDER_REVIEW" && !resolution.trim()) {
      setError("Write the reasoning — it goes on the audit trail both sides can see.");
      return;
    }

    let creatorSharePaise: number | undefined;
    if (chosen === "SPLIT") {
      const rupees = Number(creatorShareRupees);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        setError("Enter the creator's share.");
        return;
      }
      creatorSharePaise = Math.round(rupees * 100);
      if (creatorSharePaise >= escrowAmount) {
        setError(`The creator's share must be less than the full ${escrowAmountLabel}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: chosen,
          resolution: resolution.trim() || undefined,
          creatorSharePaise,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setDecision(null);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Decision reasoning"
        id="dispute-resolution"
        placeholder="What you concluded from the evidence, and why. Both parties see this."
        value={resolution}
        onChange={setResolution}
        rows={3}
      />

      {decision === "SPLIT" && (
        <Field
          label={`Creator's share in rupees (of ${escrowAmountLabel})`}
          id="dispute-creator-share"
          type="number"
          placeholder="e.g. 20000"
          value={creatorShareRupees}
          onChange={setCreatorShareRupees}
        />
      )}

      {error && <p className="text-sm text-stopped">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={loading} onClick={() => submit("RESOLVED_CREATOR")}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Release to creator
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => submit("RESOLVED_BRAND")}
        >
          Refund the brand
        </Button>
        {decision === "SPLIT" ? (
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => submit("SPLIT")}>
            Confirm split
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={() => setDecision("SPLIT")}>
            Split it
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => submit("UNDER_REVIEW")}
        >
          Mark under review
        </Button>
      </div>
    </div>
  );
}
