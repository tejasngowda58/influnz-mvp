"use client";

import { useEffect } from "react";
import { PlugZap, RotateCcw } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";

/**
 * Segment-level recovery for the dashboard.
 *
 * The common cause in practice is a dropped connection to the database rather
 * than a bug — a page shouldn't die on a single lost packet, so this offers a
 * retry that re-runs the data fetch (`unstable_retry`, added in Next 16.2)
 * instead of showing a stack trace.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard render failed", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center bg-paper p-6">
      <Card radius="surface" className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-tint text-ember-dark">
          <PlugZap className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="font-display text-xl text-strong">We couldn&apos;t load this page</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This is usually a dropped connection rather than something you did. Nothing was lost —
            try again.
          </p>
        </div>
        <Button type="button" onClick={() => unstable_retry()}>
          <RotateCcw className="h-4 w-4" strokeWidth={2} />
          Try again
        </Button>
        {error.digest && <p className="text-micro text-muted">Reference {error.digest}</p>}
      </Card>
    </div>
  );
}
