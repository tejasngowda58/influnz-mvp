import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-semibold tracking-tight text-gray-900">
            Influ<span className="text-orange-600">nz</span>
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28 md:py-32">
          <span className="rounded-full bg-orange-50 px-4 py-1 text-sm font-medium text-orange-600">
            For Instagram creators &amp; brands
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Where Creators Meet Brands
          </h1>
          <p className="max-w-2xl text-base text-gray-600 sm:text-lg">
            Influnz connects Instagram creators with brand managers for
            authentic, paid collaborations — discover the right partner,
            agree on the details, and get paid, all in one place.
          </p>
          <div className="mt-2 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
              href="/signup/creator"
              className="rounded-full bg-orange-600 px-8 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Sign up as Creator
            </Link>
            <Link
              href="/signup/brand"
              className="rounded-full border border-orange-200 bg-orange-50 px-8 py-3 text-center text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100"
            >
              Sign up as Brand
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900">
              How it works
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
                <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold tracking-wide text-orange-600 uppercase">
                  For Creators
                </span>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Get discovered, get paid
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-600 sm:text-base">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-orange-600" />
                    Build a profile that showcases your content and audience.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-orange-600" />
                    Get matched with brands looking for creators like you.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-orange-600" />
                    Negotiate collaborations and get paid securely.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
                <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold tracking-wide text-orange-600 uppercase">
                  For Brand Managers
                </span>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Find authentic creators
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-600 sm:text-base">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-orange-600" />
                    Search and filter creators by niche, city, and audience.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-orange-600" />
                    Manage every collaboration from one dashboard.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-orange-600" />
                    Track performance and payouts with full visibility.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-gray-500 sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Influnz. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="transition-colors hover:text-orange-600">
              Log in
            </Link>
            <Link href="/signup/creator" className="transition-colors hover:text-orange-600">
              For Creators
            </Link>
            <Link href="/signup/brand" className="transition-colors hover:text-orange-600">
              For Brands
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
