"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";

interface ApplyFormProps {
  campaignId: string;
  negotiable: boolean;
  campaignBudget: number;
  campaignDeliverables: string;
}

export function ApplyForm({ campaignId, negotiable, campaignBudget, campaignDeliverables }: ApplyFormProps) {
  const router = useRouter();
  const [pitch, setPitch] = useState("");
  const [proposedBudget, setProposedBudget] = useState(String(campaignBudget));
  const [proposedDeliverables, setProposedDeliverables] = useState(campaignDeliverables);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (negotiable && !(Number(proposedBudget) > 0)) {
      setError("Enter a valid proposed budget");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitch,
          ...(negotiable
            ? { proposedBudget: Number(proposedBudget), proposedDeliverables }
            : {}),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {negotiable ? (
        <div className="flex flex-col gap-4 rounded-inset border border-ember/20 bg-ember-tint p-4">
          <p className="text-xs font-medium text-ember-dark">
            Pre-filled with the brand&apos;s listed terms — edit these if you&apos;d like to propose
            something different.
          </p>
          <Field
            label="Your proposed budget"
            id="proposedBudget"
            type="number"
            value={proposedBudget}
            onChange={setProposedBudget}
          />
          <TextAreaField
            label="Your proposed deliverables"
            id="proposedDeliverables"
            value={proposedDeliverables}
            onChange={setProposedDeliverables}
            rows={2}
          />
        </div>
      ) : (
        <p className="text-sm text-muted">
          This campaign&apos;s budget and deliverables are fixed — apply below to be considered.
        </p>
      )}
      <TextAreaField
        label="Pitch (optional)"
        id="pitch"
        placeholder="Tell the brand why you're a good fit for this campaign"
        value={pitch}
        onChange={setPitch}
      />
      {error && <p className="text-sm text-stopped">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Applying..." : "Apply to this campaign"}
      </Button>
    </form>
  );
}
