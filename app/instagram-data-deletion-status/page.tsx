import { CheckCircle2 } from "lucide-react";

export default async function InstagramDataDeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Data deletion complete</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your Instagram connection data (handle, follower count, and access token) has been
          removed from Influnz.
        </p>
        {code && (
          <p className="mt-4 text-xs text-gray-400">
            Confirmation code: <span className="font-mono">{code}</span>
          </p>
        )}
      </div>
    </main>
  );
}
