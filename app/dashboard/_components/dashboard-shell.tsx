import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/app/_components/ui/logo";
import { Badge } from "@/app/_components/ui/badge";
import { LogoutButton } from "./logout-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface DashboardShellProps {
  role: "Creator" | "Brand" | "Admin";
  name?: string;
  children: React.ReactNode;
}

const ROLE_BADGE_TONE = {
  Creator: "orange",
  Brand: "orange",
  Admin: "blue",
} as const;

export async function DashboardShell({ role, name, children }: DashboardShellProps) {
  // Unread count lives in the shell so every page shows it without opting in.
  const session = await auth();
  const unreadCount = session?.user
    ? await prisma.notification.count({ where: { userId: session.user.id, readAt: null } })
    : 0;

  return (
    <div className="flex flex-1 flex-col bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo />
            </Link>
            <Badge tone={ROLE_BADGE_TONE[role]}>{role}</Badge>
          </div>
          <div className="flex items-center gap-4">
            {name && (
              <span className="hidden text-sm font-medium text-gray-600 sm:inline">{name}</span>
            )}
            <Link
              href="/dashboard/notifications"
              aria-label={
                unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
              }
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
