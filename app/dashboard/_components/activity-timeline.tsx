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
  CREATOR: "bg-blue-50 text-blue-600",
  BRAND: "bg-orange-50 text-orange-600",
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
      <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
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
              <p className="text-sm text-gray-700">
                {describeActivity({
                  actionType: entry.actionType,
                  actorRole: entry.actorRole,
                  actorName: entry.actorName,
                  details: entry.details,
                })}
              </p>
              <p className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
