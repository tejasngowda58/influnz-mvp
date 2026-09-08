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
            <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-600">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're up to date."}
            </p>
          </div>
          {unreadCount > 0 && <MarkNotificationsRead />}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Inbox className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-gray-900">Nothing here yet</p>
          <p className="max-w-sm text-sm text-gray-600">
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
                  notification.readAt ? "" : "border-orange-200 bg-orange-50/40"
                }`}
              >
                {!notification.readAt && (
                  <span className="mt-1.5 inline-block h-2 w-2 flex-none rounded-full bg-orange-500" />
                )}
                <div className={notification.readAt ? "pl-5" : ""}>
                  <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
                  <p className="mt-1.5 text-xs text-gray-400">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              </Card>
            );

            return notification.linkUrl ? (
              <Link key={notification.id} href={notification.linkUrl} className="transition-shadow hover:shadow-md">
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
