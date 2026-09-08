import type { CampaignStatus } from "@prisma/client";
import { Badge, type BadgeTone } from "@/app/_components/ui/badge";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};

const STATUS_TONES: Record<CampaignStatus, BadgeTone> = {
  PENDING_REVIEW: "neutral",
  APPROVED: "settled",
  CHANGES_REQUESTED: "accent",
  REJECTED: "stopped",
  CLOSED: "theirs",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
