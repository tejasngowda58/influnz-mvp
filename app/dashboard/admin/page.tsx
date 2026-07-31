import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreatorsTable, type CreatorRow } from "./_components/creators-table";
import { BrandsTable, type BrandRow } from "./_components/brands-table";

const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface AdminDashboardPageProps {
  searchParams: Promise<{ tab?: string; page?: string; sort?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireRole("ADMIN");

  const params = await searchParams;
  const tab: "creators" | "brands" = params.tab === "brands" ? "brands" : "creators";
  const sort: "asc" | "desc" = params.sort === "asc" ? "asc" : "desc";
  const pageParam = Number(params.page);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalCreators, totalBrands, newSignups] = await Promise.all([
    prisma.creatorProfile.count(),
    prisma.brandProfile.count(),
    prisma.user.count({
      where: {
        role: { in: ["CREATOR", "BRAND"] },
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  const total = tab === "creators" ? totalCreators : totalBrands;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: { tab?: string; page?: number; sort?: string }) {
    const query = new URLSearchParams();
    query.set("tab", overrides.tab ?? tab);
    query.set("sort", overrides.sort ?? sort);
    const nextPage = overrides.page ?? page;
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/dashboard/admin?${query.toString()}`;
  }

  let creatorRows: CreatorRow[] = [];
  let brandRows: BrandRow[] = [];

  if (tab === "creators") {
    const rows = await prisma.creatorProfile.findMany({
      orderBy: { user: { createdAt: sort } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { createdAt: true } } },
    });

    creatorRows = rows.map((row) => ({
      id: row.id,
      name: row.name,
      instagramHandle: row.instagramHandle,
      contentCategory: row.contentCategory,
      city: row.city,
      signedUp: dateFormatter.format(row.user.createdAt),
    }));
  } else {
    const rows = await prisma.brandProfile.findMany({
      orderBy: { user: { createdAt: sort } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { createdAt: true } } },
    });

    brandRows = rows.map((row) => ({
      id: row.id,
      name: row.name,
      companyName: row.companyName,
      workEmail: row.workEmail,
      industryCategory: row.industryCategory,
      city: row.city,
      signedUp: dateFormatter.format(row.user.createdAt),
    }));
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-8 sm:px-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Creators" value={totalCreators} />
        <StatCard label="Total Brands" value={totalBrands} />
        <StatCard label="New Signups (Last 7 Days)" value={newSignups} />
      </div>

      <div>
        <div className="flex gap-6 border-b border-gray-200">
          <Link
            href={buildHref({ tab: "creators", page: 1 })}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === "creators"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Creators
          </Link>
          <Link
            href={buildHref({ tab: "brands", page: 1 })}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === "brands"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Brands
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <Link
            href={buildHref({ sort: sort === "asc" ? "desc" : "asc" })}
            className="w-fit text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
          >
            Sort by signup date: {sort === "asc" ? "Oldest first" : "Newest first"}
          </Link>

          {tab === "creators" ? (
            <CreatorsTable rows={creatorRows} />
          ) : (
            <BrandsTable rows={brandRows} />
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-2">
              <Link
                href={buildHref({ page: Math.max(1, page - 1) })}
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
                href={buildHref({ page: Math.min(totalPages, page + 1) })}
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
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
