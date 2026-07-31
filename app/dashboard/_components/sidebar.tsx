"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";

const CREATORS_PATH = "/creators";

export function DashboardSidebar({ role }: { role?: UserRole }) {
  const pathname = usePathname();

  const showBrowseCreators = role === "CREATOR" || role === "BRAND";

  if (!showBrowseCreators) {
    return null;
  }

  const isActive =
    pathname === CREATORS_PATH || pathname?.startsWith(`${CREATORS_PATH}/`);

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-100 bg-white px-4 py-6 sm:flex">
      <Link
        href="/"
        className="px-1 text-lg font-semibold tracking-tight text-gray-900"
      >
        Influ<span className="text-orange-600">nz</span>
      </Link>

      <div className="mt-6">
        <Link
          href={CREATORS_PATH}
          aria-current={isActive ? "page" : undefined}
          className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 ${
            isActive ? "bg-orange-700 ring-2 ring-orange-200" : "bg-orange-600"
          }`}
        >
          <GridIcon className="h-5 w-5" />
          Search Creators
        </Link>
      </div>
    </aside>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
