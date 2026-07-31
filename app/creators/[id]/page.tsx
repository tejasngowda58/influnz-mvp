import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, CATEGORY_BADGE_CLASSES, getInitials } from "@/lib/creator-display";
import { CreatorsHeader } from "../_components/CreatorsHeader";

interface CreatorProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  await requireRole(["CREATOR", "BRAND"]);

  const { id } = await params;
  const creator = await prisma.creatorProfile.findUnique({ where: { id } });

  if (!creator) {
    return (
      <>
        <CreatorsHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <p className="text-lg font-medium text-gray-900">Creator not found</p>
          <p className="text-sm text-gray-600">
            This creator profile doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/creators"
            className="rounded-full bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            Back to Creators
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <CreatorsHeader />
      <main className="flex flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
        <Link
          href="/creators"
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
          Back to Creators
        </Link>

        <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:flex-row sm:items-start sm:text-left">
          <span className="flex h-24 w-24 flex-none items-center justify-center rounded-full bg-orange-600 text-2xl font-semibold text-white">
            {getInitials(creator.name)}
          </span>
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <h1 className="text-2xl font-semibold text-gray-900">{creator.name}</h1>
            <a
              href={`https://instagram.com/${creator.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              @{creator.instagramHandle}
            </a>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_BADGE_CLASSES[creator.contentCategory]}`}
              >
                {CATEGORY_LABELS[creator.contentCategory]}
              </span>
              <span className="text-sm text-gray-500">{creator.city}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm font-semibold text-gray-900">
            Portfolio &amp; past collaborations
          </p>
          <p className="mt-2 text-sm text-gray-500">Coming soon</p>
        </div>
      </main>
    </>
  );
}
