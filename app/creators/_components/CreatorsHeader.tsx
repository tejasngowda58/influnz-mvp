"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { getDashboardPath } from "@/lib/dashboard-path";

export function CreatorsHeader() {
  const { data: session } = useSession();
  const dashboardHref = session?.user?.role
    ? getDashboardPath(session.user.role)
    : "/";

  return (
    <header className="w-full border-b border-gray-100 bg-white px-6 py-4 sm:px-10">
      <div className="flex items-center justify-between">
        <Link
          href={dashboardHref}
          className="text-lg font-semibold tracking-tight text-gray-900"
        >
          Influ<span className="text-orange-600">nz</span>
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
