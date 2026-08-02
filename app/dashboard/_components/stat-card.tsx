import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/app/_components/ui/card";

interface StatCardProps {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  description: string;
}

export function StatCard({ href, icon: Icon, label, value, description }: StatCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="flex flex-col gap-4 p-6 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="text-2xl font-semibold text-gray-900">{value}</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </Card>
    </Link>
  );
}
