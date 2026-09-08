import Link from "next/link";
import type { CampaignStatus } from "@prisma/client";
import { Calendar, MapPin, Tag, Wallet } from "lucide-react";
import { Card } from "@/app/_components/ui/card";
import { formatBudget, formatDate, formatEnumLabel } from "@/lib/format";
import { CampaignStatusBadge } from "./campaign-status-badge";

interface CampaignCardProps {
  href: string;
  title: string;
  brandName?: string;
  category: string;
  city: string | null;
  budget: number;
  deadline: Date;
  status?: CampaignStatus;
  applicantCount?: number;
}

export function CampaignCard({
  href,
  title,
  brandName,
  category,
  city,
  budget,
  deadline,
  status,
  applicantCount,
}: CampaignCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="flex flex-col gap-3 p-6 transition-colors hover:border-line-strong">
        <div className="flex items-start justify-between gap-3">
          <div>
            {brandName && <p className="text-xs font-medium text-ember">{brandName}</p>}
            <h3 className="font-semibold text-strong">{title}</h3>
          </div>
          {status && <CampaignStatusBadge status={status} />}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
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
          <p className="text-xs font-medium text-muted/70">
            {applicantCount} applicant{applicantCount === 1 ? "" : "s"}
          </p>
        )}
      </Card>
    </Link>
  );
}
