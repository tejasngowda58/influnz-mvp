"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";

export function CampaignStatusToggle({
  campaignId,
  status,
}: {
  campaignId: string;
  status: "APPROVED" | "CLOSED";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextStatus = status === "APPROVED" ? "CLOSED" : "APPROVED";

  async function toggle() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={toggle}>
        {loading ? "Saving..." : status === "APPROVED" ? "Close campaign" : "Reopen campaign"}
      </Button>
      {error && <p className="text-xs text-stopped">{error}</p>}
    </div>
  );
}
