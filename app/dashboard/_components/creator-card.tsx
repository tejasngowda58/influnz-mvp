import Link from "next/link";
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

interface CreatorCardProps {
  id: string;
  name: string;
  instagramHandle: string | null;
  instagramProfilePictureUrl?: string | null;
  verified?: boolean;
  category: string;
  city: string;
  followerCount: number | null;
}

export function CreatorCard({
  id,
  name,
  instagramHandle,
  instagramProfilePictureUrl,
  verified,
  category,
  city,
  followerCount,
}: CreatorCardProps) {
  const handle = instagramHandle?.replace(/^@/, "") ?? null;

  return (
    <Link href={`/dashboard/brand/creators/${id}`} className="block">
      <Card className="flex flex-col gap-3 p-6 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          {instagramProfilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- unpredictable Instagram CDN host, not worth an images.remotePatterns allowlist
            <img
              src={instagramProfilePictureUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 flex-none rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600">
              {getInitials(name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900">{name}</h3>
              {verified && <Badge tone="green">Verified</Badge>}
            </div>
            <p className="text-sm text-gray-500">{handle ? `@${handle}` : "Instagram not connected"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatEnumLabel(category)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {city}
          </span>
          {followerCount != null && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
              {new Intl.NumberFormat("en-US", { notation: "compact" }).format(followerCount)} followers
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
