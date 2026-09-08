"use client";

import { Printer } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export function PrintButton() {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
      <Printer className="h-3.5 w-3.5" strokeWidth={1.75} />
      Print / save as PDF
    </Button>
  );
}
