import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-32 text-center">
        <span className="rounded-full bg-orange-50 px-4 py-1 text-sm font-medium text-orange-600">
          Connect creators &amp; brands
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Influencer partnerships, <span className="text-orange-600">made simple</span>
        </h1>
        <p className="max-w-xl text-lg text-gray-600">
          Influnz connects creators with brands for authentic collaborations
          — from discovery to payout, all in one place.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup/creator"
            className="rounded-full bg-orange-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            I&apos;m a Creator
          </Link>
          <Link
            href="/signup/brand"
            className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
          >
            I&apos;m a Brand
          </Link>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-gray-500 hover:text-orange-600"
        >
          Already have an account? Log in
        </Link>
      </section>
    </main>
  );
}
