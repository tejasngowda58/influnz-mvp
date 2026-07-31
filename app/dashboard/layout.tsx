import { auth } from "@/lib/auth";
import { DashboardSidebar } from "./_components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-1">
      <DashboardSidebar role={session?.user?.role} />
      {children}
    </div>
  );
}
