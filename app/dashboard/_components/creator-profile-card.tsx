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
  instagramHandle: string | null;
  instagramProfilePictureUrl?: string | null;
  verified?: boolean;
  category: string;
  city: string;
  followerCount: number | null;
  bio: string | null;
  children?: React.ReactNode;
}

export function CreatorProfileCard({
  name,
  instagramHandle,
  instagramProfilePictureUrl,
  verified,
  category,
  city,
  followerCount,
  bio,
  children,
}: CreatorProfileCardProps) {
  const handle = instagramHandle?.replace(/^@/, "") ?? null;
  const followerLabel =
    followerCount != null
      ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(followerCount)
      : "—";

  return (
    <Card className="mx-auto flex w-full max-w-xl flex-col overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-ember to-ember-dark">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.25),transparent_55%)]"
        />
        {instagramProfilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- unpredictable Instagram CDN host, not worth an images.remotePatterns allowlist
          <img
            src={instagramProfilePictureUrl}
            alt=""
            width={96}
            height={96}
            className="absolute -bottom-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full border-4 border-white object-cover"
          />
        ) : (
          <div className="absolute -bottom-12 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-ember-tint text-2xl font-semibold text-ember">
            {getInitials(name)}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center px-6 pt-14">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-strong">{name}</h1>
          {verified && <Badge tone="settled">Verified</Badge>}
        </div>
        {handle ? (
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-ember"
          >
            @{handle}
          </a>
        ) : (
          <span className="text-sm text-muted/70">Instagram not connected</span>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2 pb-6">
          <Badge tone="accent">{formatEnumLabel(category)}</Badge>
          <Badge tone="neutral">{city}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
        <div className="flex flex-col items-center gap-1 py-4">
          <Users className="h-4 w-4 text-muted/70" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-strong">{followerLabel}</p>
          <p className="text-xs text-muted">Followers</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <Tag className="h-4 w-4 text-muted/70" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-strong">{formatEnumLabel(category)}</p>
          <p className="text-xs text-muted">Category</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <MapPin className="h-4 w-4 text-muted/70" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-strong">{city}</p>
          <p className="text-xs text-muted">City</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-6">
        <h2 className="text-xs font-semibold tracking-wide text-muted/70 uppercase">About</h2>
        <p className="text-sm whitespace-pre-line text-strong">
          {bio?.trim() || "This creator hasn't added a bio yet."}
        </p>
      </div>

      {children && <div className="flex flex-col gap-4 border-t border-line p-6">{children}</div>}
    </Card>
  );
}
