/**
 * Status is the most important information in this product, so badges carry a
 * real vocabulary rather than a generic colour set: money states (`held`,
 * `settled`) read differently from turn states (`yours`, `theirs`).
 *
 * Sentence case, not tracked-out caps — the colour does the work.
 */
export type BadgeTone =
  | "held"
  | "yours"
  | "theirs"
  | "settled"
  | "frozen"
  | "stopped"
  | "neutral"
  | "accent";

const TONE_CLASSES: Record<BadgeTone, string> = {
  held: "bg-held/10 text-held",
  yours: "bg-ember/10 text-ember",
  theirs: "bg-muted/10 text-muted",
  settled: "bg-settled/10 text-settled",
  frozen: "bg-frozen/10 text-frozen",
  stopped: "bg-stopped/10 text-stopped",
  neutral: "bg-strong/[0.06] text-muted",
  accent: "bg-ember-tint text-ember",
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tone = "neutral", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
