import Link from "next/link";
import type { ContentCategory } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardPath } from "@/lib/dashboard-path";
import {
  CONTENT_CATEGORY_VALUES,
  CATEGORY_LABELS,
  CATEGORY_BADGE_CLASSES,
  getInitials,
} from "@/lib/creator-display";
import { CreatorFilters } from "./_components/filters";
import { CreatorsHeader } from "./_components/CreatorsHeader";

const PAGE_SIZE = 12;

interface CreatorsPageProps {
  searchParams: Promise<{
    category?: string;
    city?: string;
    page?: string;
  }>;
}

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const session = await requireRole(["CREATOR", "BRAND"]);

  const params = await searchParams;
  const categoryParam = params.category ?? "";
  const cityParam = params.city ?? "";

  const category = CONTENT_CATEGORY_VALUES.includes(categoryParam as ContentCategory)
    ? (categoryParam as ContentCategory)
    : undefined;
  const city = cityParam.trim();

  const pageParam = Number(params.page);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const where = {
    ...(category ? { contentCategory: category } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
  };

  const [creators, total] = await Promise.all([
    prisma.creatorProfile.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.creatorProfile.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildPageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (city) query.set("city", city);
    if (targetPage > 1) query.set("page", String(targetPage));
    const qs = query.toString();
    return qs ? `/creators?${qs}` : "/creators";
  }

  return (
    <>
      <CreatorsHeader />
      <main className="flex flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
        <Link
          href={getDashboardPath(session.user.role)}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Search Creators</h1>
          <p className="mt-1 text-sm text-gray-600">
            Discover creators across categories and cities.
          </p>
        </div>

        <CreatorFilters key={`${categoryParam}|${cityParam}`} category={categoryParam} city={cityParam} />

        {creators.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 py-20 text-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-10 w-10 text-gray-300"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <p className="text-base font-medium text-gray-900">No creators found</p>
            <p className="text-sm text-gray-600">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/creators/${creator.id}`}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white">
                      {getInitials(creator.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {creator.name}
                      </p>
                      <span className="mt-1 inline-flex rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                        @{creator.instagramHandle}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_BADGE_CLASSES[creator.contentCategory]}`}
                    >
                      {CATEGORY_LABELS[creator.contentCategory]}
                    </span>
                    <span className="text-xs text-gray-500">{creator.city}</span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 pt-2">
                <Link
                  href={buildPageHref(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={`rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors ${
                    page <= 1
                      ? "pointer-events-none text-gray-300"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </Link>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Link
                  href={buildPageHref(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  className={`rounded-full border border-gray-200 px-4 py-2 text-sm font-medium transition-colors ${
                    page >= totalPages
                      ? "pointer-events-none text-gray-300"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Next
                </Link>
              </nav>
            )}
          </>
        )}
      </main>
    </>
  );
}
