import { Building2, Shield, User } from "lucide-react";
import type { ActivityActionType, UserRole } from "@prisma/client";
import { describeActivity } from "@/lib/activity-log";
import { formatDateTime } from "@/lib/format";

const ROLE_ICON: Record<UserRole, typeof User> = {
  CREATOR: User,
  BRAND: Building2,
  ADMIN: Shield,
};

const ROLE_CLASSES: Record<UserRole, string> = {
  CREATOR: "bg-held/5 text-held",
  BRAND: "bg-ember-tint text-ember",
  ADMIN: "bg-purple-50 text-purple-600",
};

export interface ActivityTimelineEntry {
  id: string;
  actorRole: UserRole;
  actorName: string;
  actionType: ActivityActionType;
  details: unknown;
  createdAt: Date;
}

export function ActivityTimeline({ entries }: { entries: ActivityTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-surface border border-dashed border-line-strong py-10 text-center text-sm text-muted">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => {
        const Icon = ROLE_ICON[entry.actorRole];
        return (
          <li key={entry.id} className="flex gap-3">
            <span
              className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${ROLE_CLASSES[entry.actorRole]}`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <p className="text-sm text-strong">
                {describeActivity({
                  actionType: entry.actionType,
                  actorRole: entry.actorRole,
                  actorName: entry.actorName,
                  details: entry.details,
                })}
              </p>
              <p className="text-xs text-muted/70">{formatDateTime(entry.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
