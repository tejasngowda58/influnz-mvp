import type { ApplicationStatus } from "@prisma/client";
import { Badge, type BadgeTone } from "@/app/_components/ui/badge";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  BRAND_COUNTERED: "Brand countered",
  CREATOR_COUNTERED: "Creator countered",
  CONFIRMED: "Terms agreed",
  CONTENT_SUBMITTED: "Content submitted",
  APPROVED: "Approved",
  REJECTED: "Declined",
};

const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  APPLIED: "gray",
  SHORTLISTED: "orange",
  BRAND_COUNTERED: "blue",
  CREATOR_COUNTERED: "blue",
  CONFIRMED: "green",
  CONTENT_SUBMITTED: "orange",
  APPROVED: "green",
  REJECTED: "red",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
