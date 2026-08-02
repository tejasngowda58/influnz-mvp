import Link from "next/link";
import { Logo } from "@/app/_components/ui/logo";
import { Badge } from "@/app/_components/ui/badge";
import { LogoutButton } from "./logout-button";

interface DashboardShellProps {
  role: "Creator" | "Brand";
  name?: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, name, children }: DashboardShellProps) {
  return (
    <div className="flex flex-1 flex-col bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo />
            </Link>
            <Badge tone="orange">{role}</Badge>
          </div>
          <div className="flex items-center gap-4">
            {name && (
              <span className="hidden text-sm font-medium text-gray-600 sm:inline">{name}</span>
            )}
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
