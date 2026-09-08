import type { ApplicationStatus } from "@prisma/client";
import { Badge, type BadgeTone } from "@/app/_components/ui/badge";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  BRAND_COUNTERED: "Brand countered",
  CREATOR_COUNTERED: "Creator countered",
  CONFIRMED: "Awaiting funding",
  FUNDED: "Funded — in escrow",
  CONTENT_SUBMITTED: "Content submitted",
  APPROVED: "Approved",
  RELEASED: "Paid out",
  REJECTED: "Declined",
};

const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  APPLIED: "gray",
  SHORTLISTED: "orange",
  BRAND_COUNTERED: "blue",
  CREATOR_COUNTERED: "blue",
  CONFIRMED: "orange",
  FUNDED: "blue",
  CONTENT_SUBMITTED: "orange",
  APPROVED: "green",
  RELEASED: "green",
  REJECTED: "red",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
