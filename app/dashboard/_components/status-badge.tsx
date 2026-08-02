import type { ApplicationStatus } from "@prisma/client";
import { Badge, type BadgeTone } from "@/app/_components/ui/badge";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  CONFIRMED: "Confirmed",
  CONTENT_SUBMITTED: "Content submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  APPLIED: "gray",
  SHORTLISTED: "orange",
  CONFIRMED: "blue",
  CONTENT_SUBMITTED: "orange",
  APPROVED: "green",
  REJECTED: "red",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
