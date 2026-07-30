import { LogoutButton } from "../_components/logout-button";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function BrandDashboardPage() {
  const session = await requireRole("BRAND");

  const profile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        <LogoutButton />
      </div>
      <div className="rounded-2xl border border-gray-100 bg-orange-50/50 p-6">
        <p className="text-sm font-medium text-orange-600">Coming soon</p>
        <p className="mt-2 text-sm text-gray-600">
          Your active campaigns, creator applications, and analytics will
          appear here.
        </p>
      </div>
    </main>
  );
}
