import Link from "next/link";
import { Inbox } from "lucide-react";
import { DashboardShell } from "../_components/dashboard-shell";
import { BackLink } from "../_components/back-link";
import { Card } from "@/app/_components/ui/card";
import { requireSession } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { MarkNotificationsRead } from "./mark-notifications-read";

const ROLE_HOME = {
  CREATOR: "/dashboard/creator",
  BRAND: "/dashboard/brand",
  ADMIN: "/dashboard/admin",
} as const;

export default async function NotificationsPage() {
  const session = await requireSession();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <DashboardShell role={session.user.role === "CREATOR" ? "Creator" : session.user.role === "BRAND" ? "Brand" : "Admin"}>
      <div className="flex flex-col gap-4">
        <BackLink href={ROLE_HOME[session.user.role]} label="Back to dashboard" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-strong">Notifications</h1>
            <p className="mt-1 text-sm text-muted">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're up to date."}
            </p>
          </div>
          {unreadCount > 0 && <MarkNotificationsRead />}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-surface border border-dashed border-line-strong py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-tint text-ember">
            <Inbox className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-strong">Nothing here yet</p>
          <p className="max-w-sm text-sm text-muted">
            You&apos;ll hear from us when a campaign is reviewed, someone applies, terms are agreed,
            or money moves.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const body = (
              <Card
                className={`flex items-start gap-3 p-5 ${
                  notification.readAt ? "" : "border-ember/25 bg-ember-tint"
                }`}
              >
                {!notification.readAt && (
                  <span className="mt-1.5 inline-block h-2 w-2 flex-none rounded-full bg-ember" />
                )}
                <div className={notification.readAt ? "pl-5" : ""}>
                  <p className="text-sm font-semibold text-strong">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted">{notification.body}</p>
                  <p className="mt-1.5 text-xs text-muted/70">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              </Card>
            );

            return notification.linkUrl ? (
              <Link key={notification.id} href={notification.linkUrl} className="transition-colors hover:border-line-strong">
                {body}
              </Link>
            ) : (
              <div key={notification.id}>{body}</div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
