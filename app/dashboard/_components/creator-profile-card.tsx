import { MapPin, Tag, Users } from "lucide-react";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { formatEnumLabel } from "@/lib/format";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface CreatorProfileCardProps {
  name: string;
  instagramHandle: string;
  category: string;
  city: string;
  followerCount: number | null;
  bio: string | null;
  children?: React.ReactNode;
}

export function CreatorProfileCard({
  name,
  instagramHandle,
  category,
  city,
  followerCount,
  bio,
  children,
}: CreatorProfileCardProps) {
  const handle = instagramHandle.replace(/^@/, "");
  const followerLabel =
    followerCount != null
      ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(followerCount)
      : "—";

  return (
    <Card className="mx-auto flex w-full max-w-xl flex-col overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-orange-500 to-orange-600">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.25),transparent_55%)]"
        />
      </div>

      <div className="flex flex-col items-center px-6">
        <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-orange-50 text-2xl font-semibold text-orange-600 shadow-sm">
          {getInitials(name)}
        </div>
        <h1 className="mt-3 text-xl font-semibold text-gray-900">{name}</h1>
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-orange-600"
        >
          @{handle}
        </a>

        <div className="mt-4 flex flex-wrap justify-center gap-2 pb-6">
          <Badge tone="orange">{formatEnumLabel(category)}</Badge>
          <Badge tone="gray">{city}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-y border-gray-100">
        <div className="flex flex-col items-center gap-1 py-4">
          <Users className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-gray-900">{followerLabel}</p>
          <p className="text-xs text-gray-500">Followers</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <Tag className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-gray-900">{formatEnumLabel(category)}</p>
          <p className="text-xs text-gray-500">Category</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <MapPin className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-gray-900">{city}</p>
          <p className="text-xs text-gray-500">City</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-6">
        <h2 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">About</h2>
        <p className="text-sm whitespace-pre-line text-gray-700">
          {bio?.trim() || "This creator hasn't added a bio yet."}
        </p>
      </div>

      {children && <div className="flex flex-col gap-4 border-t border-gray-100 p-6">{children}</div>}
    </Card>
  );
}
