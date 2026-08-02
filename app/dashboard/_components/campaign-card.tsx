import Link from "next/link";
import { Calendar, MapPin, Tag, Wallet } from "lucide-react";
import { Card } from "@/app/_components/ui/card";
import { Badge, type BadgeTone } from "@/app/_components/ui/badge";
import { formatBudget, formatDate, formatEnumLabel } from "@/lib/format";

const STATUS_TONE: Record<"OPEN" | "CLOSED", BadgeTone> = {
  OPEN: "green",
  CLOSED: "gray",
};

interface CampaignCardProps {
  href: string;
  title: string;
  category: string;
  city: string | null;
  budget: number;
  deadline: Date;
  status?: "OPEN" | "CLOSED";
  applicantCount?: number;
}

export function CampaignCard({
  href,
  title,
  category,
  city,
  budget,
  deadline,
  status,
  applicantCount,
}: CampaignCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="flex flex-col gap-3 p-6 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {status && <Badge tone={STATUS_TONE[status]}>{formatEnumLabel(status)}</Badge>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatEnumLabel(category)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {city || "Any city"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatBudget(budget)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatDate(deadline)}
          </span>
        </div>
        {typeof applicantCount === "number" && (
          <p className="text-xs font-medium text-gray-400">
            {applicantCount} applicant{applicantCount === 1 ? "" : "s"}
          </p>
        )}
      </Card>
    </Link>
  );
}
