"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/app/_components/ui/button";

export function LogoutButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Log out
    </Button>
  );
}
