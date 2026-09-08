import type { LucideIcon } from "lucide-react";
import { LinkButton } from "@/app/_components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** Say what happens next, not just that there's nothing here. */
  body: string;
  action?: { label: string; href: string };
}

/**
 * Every empty state is a chance to explain the product to someone who hasn't
 * used it yet, so each one says what will appear here and what causes it to.
 */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-surface border border-dashed border-line-strong bg-surface/60 px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-tint text-ember">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="text-base font-semibold text-strong">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted">{body}</p>
      {action && (
        <div className="mt-2">
          <LinkButton href={action.href} size="sm">
            {action.label}
          </LinkButton>
        </div>
      )}
    </div>
  );
}
