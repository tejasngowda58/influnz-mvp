export default function CreatorDashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
      <h1 className="text-2xl font-semibold text-gray-900">
        Creator dashboard
      </h1>
      <div className="rounded-2xl border border-gray-100 bg-orange-50/50 p-6">
        <p className="text-sm text-gray-600">
          Your campaigns, earnings, and collaboration requests will appear
          here.
        </p>
      </div>
    </main>
  );
}
