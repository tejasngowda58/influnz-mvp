import type { LucideIcon } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { Card } from "@/app/_components/ui/card";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyStateCard({ icon: Icon, title, description }: EmptyStateCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ember-tint text-ember-dark">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <Badge tone="neutral">Coming soon</Badge>
      </div>
      <div>
        <h3 className="font-semibold text-strong">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </Card>
  );
}
