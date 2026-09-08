import { CheckCircle2 } from "lucide-react";

export default async function InstagramDataDeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-md rounded-surface border border-line bg-white p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-settled/5 text-settled">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-strong">Data deletion complete</h1>
        <p className="mt-2 text-sm text-muted">
          Your Instagram connection data (handle, follower count, and access token) has been
          removed from Influnz.
        </p>
        {code && (
          <p className="mt-4 text-xs text-muted">
            Confirmation code: <span className="font-mono">{code}</span>
          </p>
        )}
      </div>
    </main>
  );
}
