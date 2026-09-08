"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export function AcceptContractButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${applicationId}/accept`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
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
    <div className="flex flex-col items-start gap-2">
      <Button type="button" size="sm" disabled={loading} onClick={accept}>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Accept these terms
      </Button>
      {error && <p className="text-xs text-stopped">{error}</p>}
    </div>
  );
}
