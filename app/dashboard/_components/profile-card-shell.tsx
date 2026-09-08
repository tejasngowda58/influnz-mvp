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

interface ProfileCardShellProps {
  name: string;
  handle: string | null;
  photoUrl: string | null;
  verified?: boolean;
  category: string;
  city: string;
  followerCount: number | null;
  bio: string | null;
  /** Overlaid on the avatar — the owner's "change photo" affordance. */
  avatarAction?: React.ReactNode;
  /** Shown instead of a dash when there is no follower count yet. */
  followerFallback?: React.ReactNode;
  /** Shown instead of the placeholder sentence when there is no bio yet. */
  bioFallback?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * The shared presentational core of a creator profile.
 *
 * Both audiences render this: the creator looking at their own profile (who
 * gets edit affordances passed in through the slots) and a brand sizing them
 * up (who gets none). Keeping the presentation in one place is what makes
 * "this is exactly what brands see" actually true.
 */
export function ProfileCardShell({
  name,
  handle,
  photoUrl,
  verified,
  category,
  city,
  followerCount,
  bio,
  avatarAction,
  followerFallback,
  bioFallback,
  children,
}: ProfileCardShellProps) {
  const cleanHandle = handle?.replace(/^@/, "") ?? null;
  const followerLabel =
    followerCount != null
      ? new Intl.NumberFormat("en-IN", { notation: "compact" }).format(followerCount)
      : null;

  return (
    <Card radius="surface" className="mx-auto flex w-full max-w-xl flex-col overflow-hidden">
      <div className="relative h-28 bg-ink">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URLs and an unpredictable Instagram CDN host
              <img
                src={photoUrl}
                alt={`${name}'s profile photo`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-4 border-surface object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-ember-tint text-2xl font-semibold text-ember-dark">
                {getInitials(name)}
              </div>
            )}
            {avatarAction}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-6 pt-14">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl text-strong">{name}</h2>
          {verified && <Badge tone="settled">Verified</Badge>}
        </div>
        {cleanHandle ? (
          <a
            href={`https://instagram.com/${cleanHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-ember-dark"
          >
            @{cleanHandle}
          </a>
        ) : (
          <span className="text-sm text-muted">Instagram not connected</span>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2 pb-6">
          <Badge tone="accent">{formatEnumLabel(category)}</Badge>
          <Badge tone="neutral">{city}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
        <div className="flex flex-col items-center gap-1 py-4">
          <Users className="h-4 w-4 text-muted" strokeWidth={1.75} />
          {followerLabel ? (
            <p className="text-sm font-semibold text-strong">{followerLabel}</p>
          ) : (
            (followerFallback ?? <p className="text-sm font-semibold text-muted">—</p>)
          )}
          <p className="text-xs text-muted">Followers</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <Tag className="h-4 w-4 text-muted" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-strong">{formatEnumLabel(category)}</p>
          <p className="text-xs text-muted">Category</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <MapPin className="h-4 w-4 text-muted" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-strong">{city}</p>
          <p className="text-xs text-muted">City</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-6">
        <h3 className="text-xs font-semibold text-muted">About</h3>
        {bio?.trim() ? (
          <p className="text-sm whitespace-pre-line text-strong">{bio}</p>
        ) : (
          (bioFallback ?? (
            <p className="text-sm text-muted">This creator hasn&apos;t added a bio yet.</p>
          ))
        )}
      </div>

      {children && <div className="flex flex-col gap-4 border-t border-line p-6">{children}</div>}
    </Card>
  );
}
