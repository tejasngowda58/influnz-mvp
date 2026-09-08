import Link from "next/link";
import {
  AtSign,
  BarChart3,
  Building2,
  Handshake,
  Layers,
  Link2,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { Logo } from "./_components/ui/logo";
import { LinkButton } from "./_components/ui/button";
import { Card } from "./_components/ui/card";
import { Badge } from "./_components/ui/badge";
import { CONTENT_CATEGORIES } from "@/lib/content-categories";

const CREATOR_POINTS = [
  { icon: UserCircle, text: "Build a profile that showcases your content and audience." },
  { icon: Handshake, text: "Get matched with brands looking for creators like you." },
  { icon: ShieldCheck, text: "Negotiate collaborations and get paid securely." },
];

const BRAND_POINTS = [
  { icon: Search, text: "Search and filter creators by niche, city, and audience." },
  { icon: Layers, text: "Manage every collaboration from one dashboard." },
  { icon: BarChart3, text: "Track performance and payouts with full visibility." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-3">
            <LinkButton href="/login" variant="ghost" size="sm">
              Log in
            </LinkButton>
            <LinkButton href="#get-started" variant="primary" size="sm">
              Get started
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,88,12,0.08),transparent_55%)]"
          />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28 md:py-32 lg:px-8">
            <Badge>For Instagram creators &amp; brands</Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-strong sm:text-5xl md:text-6xl">
              Where Creators Meet Brands
            </h1>
            <p className="max-w-2xl text-base text-muted sm:text-lg">
              Influnz connects Instagram creators with brand managers for
              authentic, paid collaborations — discover the right partner,
              agree on the details, and get paid, all in one place.
            </p>
            <div id="get-started" className="mt-2 flex w-full scroll-mt-24 flex-col gap-4 sm:w-auto sm:flex-row">
              <LinkButton href="/signup/creator" size="lg">
                Sign up as Creator
              </LinkButton>
              <LinkButton href="/signup/brand" variant="outline" size="lg">
                Sign up as Brand
              </LinkButton>
            </div>

            {/* Hero visual: creator <-> brand match */}
            <div className="mt-10 flex items-center justify-center gap-4 sm:gap-6">
              <Card className="w-36 p-4 text-left sm:w-44">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ember-tint text-ember">
                  <AtSign className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <p className="mt-3 text-sm font-semibold text-strong">Creator</p>
                <p className="text-xs text-muted">@yourhandle · Fashion</p>
              </Card>
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ember text-white">
                <Link2 className="h-5 w-5" strokeWidth={2} />
              </span>
              <Card className="w-36 p-4 text-left sm:w-44">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ember-tint text-ember">
                  <Building2 className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <p className="mt-3 text-sm font-semibold text-strong">Brand</p>
                <p className="text-xs text-muted">Paid campaign</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-line bg-paper">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:px-8 text-center sm:grid-cols-3">
            <div>
              <p className="text-2xl font-semibold text-strong">{CONTENT_CATEGORIES.length}</p>
              <p className="mt-1 text-sm text-muted">content categories to match on</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-strong">2 sides</p>
              <p className="mt-1 text-sm text-muted">purpose-built for creators &amp; brands</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="flex items-center gap-1.5 text-2xl font-semibold text-strong">
                <LockKeyhole className="h-5 w-5 text-ember" strokeWidth={2} />
                Secure
              </p>
              <p className="mt-1 text-sm text-muted">sign-up and account access</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-strong">
              How it works
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <Card className="p-8">
                <Badge>For Creators</Badge>
                <h3 className="mt-4 text-xl font-semibold text-strong">
                  Get discovered, get paid
                </h3>
                <ul className="mt-4 space-y-4 text-sm text-muted sm:text-base">
                  {CREATOR_POINTS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ember-tint text-ember">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-8">
                <Badge>For Brand Managers</Badge>
                <h3 className="mt-4 text-xl font-semibold text-strong">
                  Find authentic creators
                </h3>
                <ul className="mt-4 space-y-4 text-sm text-muted sm:text-base">
                  {BRAND_POINTS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ember-tint text-ember">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-strong">
              Every kind of content, one platform
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
              Creators sign up under the category that fits their content, so
              brands can find the right match fast.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {CONTENT_CATEGORIES.map((category) => (
                <Badge key={category.value} tone="neutral" className="px-4 py-1.5 text-sm normal-case">
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-10 sm:px-6 lg:px-8 text-sm text-muted sm:flex-row sm:justify-between">
          <Logo className="text-base" />
          <div className="flex gap-6">
            <Link href="/login" className="transition-colors hover:text-ember">
              Log in
            </Link>
            <Link href="/signup/creator" className="transition-colors hover:text-ember">
              For Creators
            </Link>
            <Link href="/signup/brand" className="transition-colors hover:text-ember">
              For Brands
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-ember">
              Privacy
            </Link>
          </div>
          <span>&copy; {new Date().getFullYear()} Influnz. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
