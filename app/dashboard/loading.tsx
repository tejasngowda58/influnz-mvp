/**
 * Shown while a dashboard page's data is in flight. Worth having: the database
 * is remote, so on a slow connection this is the difference between "loading"
 * and "broken".
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 bg-paper p-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-64 animate-pulse rounded-inset bg-line" />
          <div className="h-4 w-80 animate-pulse rounded-inset bg-line/70" />
        </div>
        <div className="h-28 animate-pulse rounded-surface border border-line bg-surface" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-card border border-line bg-surface"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
