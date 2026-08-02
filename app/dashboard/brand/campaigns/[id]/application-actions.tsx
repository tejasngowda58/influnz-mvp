"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import { ALLOWED_TRANSITIONS, STATUS_ACTION_LABELS } from "@/lib/application-status";

export function ApplicationActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<ApplicationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = ALLOWED_TRANSITIONS[status];

  async function updateStatus(nextStatus: ApplicationStatus) {
    setError(null);
    setLoading(nextStatus);

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(null);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (nextStatuses.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {nextStatuses.map((nextStatus) => (
          <Button
            key={nextStatus}
            type="button"
            variant={nextStatus === "REJECTED" ? "ghost" : "outline"}
            size="sm"
            disabled={loading !== null}
            onClick={() => updateStatus(nextStatus)}
          >
            {loading === nextStatus ? "Saving..." : STATUS_ACTION_LABELS[nextStatus]}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
