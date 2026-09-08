import type { LucideIcon } from "lucide-react";
import { Card } from "@/app/_components/ui/card";

interface ProfileField {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface ProfileCardProps {
  title: string;
  fields: ProfileField[];
}

export function ProfileCard({ title, fields }: ProfileCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-strong">{title}</h2>
      <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ember-tint text-ember-dark">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <dt className="text-xs font-medium text-muted">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium break-words text-strong">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  );
}
