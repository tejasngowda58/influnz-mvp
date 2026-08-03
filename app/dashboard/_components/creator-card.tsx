import Link from "next/link";
import { MapPin, Tag, Users } from "lucide-react";
import { Card } from "@/app/_components/ui/card";
import { formatEnumLabel } from "@/lib/format";

interface CreatorCardProps {
  id: string;
  name: string;
  instagramHandle: string;
  category: string;
  city: string;
  followerCount: number | null;
}

export function CreatorCard({ id, name, instagramHandle, category, city, followerCount }: CreatorCardProps) {
  const handle = instagramHandle.replace(/^@/, "");

  return (
    <Link href={`/dashboard/brand/creators/${id}`} className="block">
      <Card className="flex flex-col gap-3 p-6 transition-shadow hover:shadow-md">
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">@{handle}</p>
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
