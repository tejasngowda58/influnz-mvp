import { AtSign } from "lucide-react";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { DisconnectInstagramButton } from "./disconnect-instagram-button";
import { formatDate } from "@/lib/format";

const ERROR_MESSAGES: Record<string, string> = {
  denied: "You declined the Instagram connection request.",
  invalid_state: "That connection attempt expired. Please try again.",
  personal_account:
    "Instagram connections require a Business or Creator account. Switch your account type in the Instagram app, then try again.",
  failed: "We couldn't connect your Instagram account. Please try again.",
};

interface InstagramConnectionCardProps {
  instagramHandle: string | null;
  instagramProfilePictureUrl: string | null;
  instagramConnectedAt: Date;
  connectedNotice?: boolean;
  errorCode?: string;
}

/**
 * Shown only once an account is actually connected. The prompt to connect
 * lives in the profile checklist instead, so a creator isn't nagged from two
 * places about the same thing.
 */
export function InstagramConnectionCard({
  instagramHandle,
  instagramProfilePictureUrl,
  instagramConnectedAt,
  connectedNotice,
  errorCode,
}: InstagramConnectionCardProps) {
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.failed) : null;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
      <div className="flex items-center gap-3">
        {instagramProfilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- unpredictable Instagram CDN host
          <img
            src={instagramProfilePictureUrl}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-tint text-ember">
            <AtSign className="h-5 w-5" strokeWidth={1.75} />
          </span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-strong">@{instagramHandle}</p>
            <Badge tone="settled">Verified</Badge>
          </div>
          <p className="text-sm text-muted">Synced {formatDate(instagramConnectedAt)}</p>
          {connectedNotice && (
            <p className="mt-1 text-sm font-medium text-settled">Instagram connected.</p>
          )}
          {errorMessage && <p className="mt-1 text-sm text-stopped">{errorMessage}</p>}
        </div>
      </div>
      <DisconnectInstagramButton />
    </Card>
  );
}
