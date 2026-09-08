import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  FileCheck2,
  Lock,
  Scale,
  UserRound,
} from "lucide-react";
import { Logo } from "./_components/ui/logo";
import { LinkButton } from "./_components/ui/button";

const LIFECYCLE = [
  { title: "Brand posts a campaign", body: "Budget, deliverables, deadline, and how many creators they need." },
  { title: "We vet it", body: "Every campaign is reviewed by Influnz before a single creator sees it." },
  { title: "Creators apply", body: "Verified creators pitch, and can counter on price if the brand allows it." },
  { title: "Terms are settled", body: "Turn-based, capped at two counters, then frozen into an agreement both sides accept." },
  { title: "Money goes into escrow", body: "The brand funds the full fee before any work starts. Creators don't work on a promise." },
  { title: "Creator delivers", body: "Content goes to the brand for review, with the clock running." },
  { title: "Money is released", body: "On approval — or automatically after seven days if the brand goes quiet." },
];

const BRAND_POINTS = [
  "Only creators whose follower counts came from Instagram itself, not a form",
  "Every deal, offer, and delivery in one place instead of six DM threads",
  "A dispute process with a real decision at the end of it",
];

const CREATOR_POINTS = [
  "See the money is held before you shoot a single frame",
  "Get paid automatically if the brand stops replying after you deliver",
  "A written agreement that can't be edited after you accept it",
];

/**
 * Brand → escrow → creator, as one gesture.
 *
 * The money travels down a rail beside the nodes rather than through them, so
 * it is never hidden behind a card mid-flight.
 */
function EscrowFlow() {
  const nodes = [
    { icon: Building2, label: "Brand", detail: "funds the deal" },
    { icon: Lock, label: "Influnz escrow", detail: "holds the money" },
    { icon: UserRound, label: "Creator", detail: "gets paid on approval" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-[2.75rem_1fr]" aria-hidden>
      {/* The rail, and the money on it. */}
      <div className="relative">
        <div className="absolute top-8 bottom-8 left-1/2 w-px -translate-x-1/2 bg-white/15" />
        <div
          className="escrow-flow-pill absolute top-5 left-1/2 -translate-x-1/2 rounded-full bg-ember px-2 py-1 text-[11px] font-bold whitespace-nowrap text-white"
          style={{ "--flow-mid": "5.375rem", "--flow-end": "10.75rem" } as React.CSSProperties}
        >
          ₹40k
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {nodes.map((node) => (
          <div
            key={node.label}
            className="flex items-center gap-3 rounded-card border border-white/10 bg-ink-soft/90 px-4 py-3"
          >
            <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-inset bg-white/10 text-white">
              <node.icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{node.label}</p>
              <p className="text-xs text-white/55">{node.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ---------------- expressive surface: ink ---------------- */}
      <div className="bg-ink">
        <header className="border-b border-white/10">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Logo inverted />
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="#how-it-works"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline"
              >
                How it works
              </Link>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
              >
                Log in
              </Link>
              <LinkButton href="/signup/creator" variant="inverse" size="sm">
                Sign up
              </LinkButton>
            </nav>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-7xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:px-8 lg:py-24">
          <div>
            <h1 className="font-display text-hero text-white sm:text-[3.5rem] sm:leading-[1.02]">
              Brands and creators don&apos;t have to trust each other.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Influnz holds the brand&apos;s money from the moment terms are agreed until the work is
              approved. No chasing invoices, no paying a stranger up front, no arguing later about
              what &ldquo;three reels&rdquo; meant.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/signup/brand" variant="primary" size="lg">
                I&apos;m a brand
              </LinkButton>
              <LinkButton href="/signup/creator" variant="inverse" size="lg">
                I&apos;m a creator
              </LinkButton>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6">
              {[
                { icon: BadgeCheck, label: "Instagram-verified creators" },
                { icon: FileCheck2, label: "Every campaign reviewed" },
                { icon: Scale, label: "Disputes actually decided" },
              ].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2 text-sm text-white/60">
                  <item.icon className="h-4 w-4 text-ember" strokeWidth={2} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <EscrowFlow />
        </section>
      </div>

      {/* ---------------- calm surface: the explanation ---------------- */}
      <main className="flex-1 bg-paper">
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-display text-strong">
              What actually goes wrong, and what we do about it
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                problem: "The creator delivers, then the brand goes quiet.",
                fix: "Money is already in escrow, and releases automatically after seven days of silence.",
              },
              {
                problem: "The brand pays up front, then the creator disappears.",
                fix: "Nothing reaches the creator until the brand approves the work.",
              },
              {
                problem: "Nobody agrees what was promised.",
                fix: "Terms are frozen when both sides accept, and every offer is on the record.",
              },
            ].map((item) => (
              <div key={item.problem} className="rounded-card border border-line bg-surface p-6">
                <p className="text-base font-semibold text-strong">{item.problem}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.fix}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-t border-line">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className="font-display text-display text-strong">One deal, start to finish</h2>
            <p className="mt-3 max-w-xl text-base text-muted">
              Nothing skips review, and nothing is left unrecorded.
            </p>

            <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {LIFECYCLE.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-ember/30 bg-ember-tint text-sm font-bold text-ember">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-strong">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-20">
            {[
              {
                icon: Building2,
                title: "For brands",
                points: BRAND_POINTS,
                cta: { label: "Post a campaign", href: "/signup/brand" },
              },
              {
                icon: UserRound,
                title: "For creators",
                points: CREATOR_POINTS,
                cta: { label: "Find paid work", href: "/signup/creator" },
              },
            ].map((side) => (
              <div
                key={side.title}
                className="flex flex-col rounded-surface border border-line bg-surface p-8"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-inset bg-ember-tint text-ember">
                  <side.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-display text-2xl text-strong">{side.title}</h3>
                <ul className="mt-5 flex flex-1 flex-col gap-3">
                  {side.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-ember" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <LinkButton href={side.cta.href} size="md">
                    {side.cta.label}
                  </LinkButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-ink">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Logo inverted />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
            <Link href="/login" className="transition-colors hover:text-white">
              Log in
            </Link>
            <Link href="/signup/creator" className="transition-colors hover:text-white">
              Creator sign-up
            </Link>
            <Link href="/signup/brand" className="transition-colors hover:text-white">
              Brand sign-up
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
