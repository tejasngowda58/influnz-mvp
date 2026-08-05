"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";

export function DisconnectInstagramButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/instagram/disconnect", { method: "POST" });
      if (!response.ok) {
        setError("Something went wrong. Please try again.");
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
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={disconnect}>
        {loading ? "Disconnecting..." : "Disconnect"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
