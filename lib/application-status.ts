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
  FUNDED: {},
  CONTENT_SUBMITTED: {},
  APPROVED: {},
  RELEASED: {},
  REJECTED: {},
};

export function nextStatusForAction(
  current: ApplicationStatus,
  action: NegotiationAction,
): ApplicationStatus | null {
  return NEGOTIATION_RESULT[current]?.[action] ?? null;
}

/**
 * Forward-only pipeline the brand drives by hand, once terms are agreed *and*
 * the money is in escrow.
 *
 * CONFIRMED is deliberately absent: an application only leaves CONFIRMED when a
 * verified payment lands (see `lib/escrow.ts`), so a brand cannot ask a creator
 * to start work without funding it first. APPROVED is likewise absent because
 * RELEASED is driven by the escrow release, not by a status PATCH.
 */
export const ALLOWED_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  FUNDED: ["CONTENT_SUBMITTED"],
  CONTENT_SUBMITTED: ["APPROVED"],
};

/** Terms are locked in and the deal is live — money is involved from here on. */
export const LIVE_DEAL_STATUSES: ApplicationStatus[] = [
  "CONFIRMED",
  "FUNDED",
  "CONTENT_SUBMITTED",
  "APPROVED",
  "RELEASED",
];

export const STATUS_ACTION_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  BRAND_COUNTERED: "Countered",
  CREATOR_COUNTERED: "Countered",
  CONFIRMED: "Confirm",
  FUNDED: "Funded",
  CONTENT_SUBMITTED: "Mark content submitted",
  APPROVED: "Approve",
  RELEASED: "Paid out",
  REJECTED: "Reject",
};
