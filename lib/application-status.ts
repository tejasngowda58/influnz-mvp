import type { ApplicationStatus } from "@prisma/client";

export const MAX_NEGOTIATION_ROUNDS = 2;

export type NegotiationAction = "ACCEPT" | "COUNTER" | "DECLINE";
export type NegotiationActor = "CREATOR" | "BRAND";

/** Whose turn it is to act while an application is still being negotiated. */
export const NEGOTIATION_TURN: Partial<Record<ApplicationStatus, NegotiationActor>> = {
  APPLIED: "BRAND",
  BRAND_COUNTERED: "CREATOR",
  CREATOR_COUNTERED: "BRAND",
};

/** Which negotiation actions are available from a given status (before checking campaign.negotiable). */
export const NEGOTIATION_ACTIONS: Partial<Record<ApplicationStatus, NegotiationAction[]>> = {
  APPLIED: ["ACCEPT", "COUNTER", "DECLINE"],
  BRAND_COUNTERED: ["ACCEPT", "COUNTER", "DECLINE"],
  CREATOR_COUNTERED: ["ACCEPT", "DECLINE"], // round cap reached, no more countering
};

const NEGOTIATION_RESULT: Record<ApplicationStatus, Partial<Record<NegotiationAction, ApplicationStatus>>> = {
  APPLIED: { ACCEPT: "CONFIRMED", COUNTER: "BRAND_COUNTERED", DECLINE: "REJECTED" },
  BRAND_COUNTERED: { ACCEPT: "CONFIRMED", COUNTER: "CREATOR_COUNTERED", DECLINE: "REJECTED" },
  CREATOR_COUNTERED: { ACCEPT: "CONFIRMED", DECLINE: "REJECTED" },
  SHORTLISTED: {},
  CONFIRMED: {},
  CONTENT_SUBMITTED: {},
  APPROVED: {},
  REJECTED: {},
};

export function nextStatusForAction(
  current: ApplicationStatus,
  action: NegotiationAction,
): ApplicationStatus | null {
  return NEGOTIATION_RESULT[current]?.[action] ?? null;
}

/** Simple forward-only pipeline once terms are agreed — brand-driven, unchanged from before negotiation existed. */
export const ALLOWED_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  CONFIRMED: ["CONTENT_SUBMITTED"],
  CONTENT_SUBMITTED: ["APPROVED"],
};

export const STATUS_ACTION_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  BRAND_COUNTERED: "Countered",
  CREATOR_COUNTERED: "Countered",
  CONFIRMED: "Confirm",
  CONTENT_SUBMITTED: "Mark content submitted",
  APPROVED: "Approve",
  REJECTED: "Reject",
};
