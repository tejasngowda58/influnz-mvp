import { LogoutButton } from "../_components/logout-button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 sm:px-10">
        <span className="text-lg font-semibold text-gray-900">
          Influnz <span className="text-orange-600">Admin</span>
        </span>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
