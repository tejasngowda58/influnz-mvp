"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";

export function ConnectInstagramButton() {
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button type="button" size="sm" onClick={() => setComingSoon(true)}>
        Connect Instagram
      </Button>
      {comingSoon && (
        <p className="text-sm font-medium text-ember-dark">Coming soon — check back later.</p>
      )}
    </div>
  );
}
