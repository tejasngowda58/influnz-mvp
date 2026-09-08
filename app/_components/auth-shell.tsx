import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./ui/logo";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  pitch: string;
  children: React.ReactNode;
}

export function AuthShell({ eyebrow, title, pitch, children }: AuthShellProps) {
  return (
    <main className="flex flex-1">
      <div className="relative hidden w-full max-w-md flex-none flex-col justify-between overflow-hidden bg-ember px-10 py-10 lg:flex xl:max-w-lg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(0,0,0,0.15),transparent_50%)]"
        />
        <Link href="/" className="relative z-10 w-fit">
          <Logo inverted />
        </Link>
        <div className="relative z-10 flex flex-col gap-3">
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-ember-tint">
            {eyebrow}
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="max-w-sm text-sm text-ember-tint/90">{pitch}</p>
        </div>
        <p className="relative z-10 text-xs text-ember-tint/70">
          &copy; {new Date().getFullYear()} Influnz. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block w-fit lg:hidden">
            <Logo />
          </Link>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ember"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to home
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}
