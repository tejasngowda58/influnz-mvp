"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Field, TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";
import { Dialog } from "@/app/_components/ui/dialog";

const REASONS = [
  "Content wasn't delivered",
  "Content doesn't match what was agreed",
  "Deadline was missed",
  "Brand won't approve delivered work",
  "Something else",
];

export function RaiseDisputeDialog({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Describe what went wrong so an admin can decide.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          reason,
          description: description.trim(),
          evidence: evidence
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-muted underline underline-offset-2 hover:text-stopped"
      >
        Raise a dispute
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Raise a dispute"
        description="The money stays frozen in escrow until an admin reviews both sides."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dispute-reason" className="text-sm font-medium text-strong">
              What&apos;s the problem?
            </label>
            <select
              id="dispute-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-inset border border-line-strong bg-white px-4 py-2.5 text-sm text-strong focus:border-ember/50 focus:ring-2 focus:ring-ember/20 focus:outline-none"
            >
              {REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <TextAreaField
            label="What happened?"
            id="dispute-description"
            placeholder="Give the admin the facts: what was agreed, what was delivered, and what you're asking for."
            value={description}
            onChange={setDescription}
            rows={4}
          />

          <Field
            label="Evidence links (optional, one per line)"
            id="dispute-evidence"
            type="text"
            placeholder="https://instagram.com/p/…"
            value={evidence}
            onChange={setEvidence}
          />

          {error && <p className="text-sm text-stopped">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Raise dispute
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
