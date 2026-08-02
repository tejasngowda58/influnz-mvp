import type { ApplicationStatus } from "@prisma/client";

export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["CONFIRMED", "REJECTED"],
  CONFIRMED: ["CONTENT_SUBMITTED"],
  CONTENT_SUBMITTED: ["APPROVED"],
  APPROVED: [],
  REJECTED: [],
};

export const STATUS_ACTION_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlist",
  CONFIRMED: "Confirm",
  CONTENT_SUBMITTED: "Mark content submitted",
  APPROVED: "Approve",
  REJECTED: "Reject",
};
