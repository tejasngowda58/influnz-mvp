"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextAreaField } from "@/app/_components/field";
import { Button } from "@/app/_components/ui/button";

export function ApplyForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pitch, setPitch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch }),
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
      <TextAreaField
        label="Pitch (optional)"
        id="pitch"
        placeholder="Tell the brand why you're a good fit for this campaign"
        value={pitch}
        onChange={setPitch}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Applying..." : "Apply to this campaign"}
      </Button>
    </form>
  );
}
