import type { ActivityActionType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** A single before/after field change, e.g. a counter-offer's budget or deliverables. */
export interface ActivityChange {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

/** Selection shape needed by resolveActorDisplayName — pass this to any `actor: { select: ... }`. */
export const ACTOR_DISPLAY_SELECT = {
  email: true,
  creatorProfile: { select: { name: true } },
  brandProfile: { select: { name: true } },
} as const;

export function resolveActorDisplayName(actor: {
  email: string;
  creatorProfile: { name: string } | null;
  brandProfile: { name: string } | null;
}): string {
  return actor.creatorProfile?.name ?? actor.brandProfile?.name ?? actor.email;
}

export interface LogCampaignActivityInput {
  campaignId: string;
  applicationId?: string;
  actorId: string;
  actorRole: UserRole;
  actionType: ActivityActionType;
  /** Structured details — prefer `{ changes: ActivityChange[] }` for edits, or a plain note for one-off events. */
  details?: { changes?: ActivityChange[]; note?: string } | null;
}

/**
 * Records a CampaignActivity row. Pass a transaction client (`tx`) from
 * inside `prisma.$transaction(...)` so the log write succeeds or fails
 * atomically with the mutation it's describing — never call this after a
 * separate, already-committed write.
 */
export async function logCampaignActivity(
  input: LogCampaignActivityInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await client.campaignActivity.create({
    data: {
      campaignId: input.campaignId,
      applicationId: input.applicationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      actionType: input.actionType,
      details: input.details ? (input.details as Prisma.InputJsonValue) : undefined,
    },
  });
}

interface ActivityDetails {
  changes?: ActivityChange[];
  note?: string;
}

function formatChangeValue(field: string, value: string | number | null): string {
  if (value == null) return "—";
  if (field === "budget") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(value));
  }
  return String(value);
}

function summarizeChanges(changes: ActivityChange[] | undefined): string {
  if (!changes || changes.length === 0) return "";
  return changes
    .map((c) => `${formatChangeValue(c.field, c.newValue)} instead of ${formatChangeValue(c.field, c.oldValue)}`)
    .join(", ");
}

/** Short, actor-free summary of just the details field — for compact table cells. */
export function summarizeActivityDetails(details: unknown): string {
  const parsed = (details ?? {}) as ActivityDetails;
  if (parsed.changes?.length) return summarizeChanges(parsed.changes);
  if (parsed.note) return parsed.note;
  return "—";
}

/** Renders a CampaignActivity row as a plain-language sentence for the admin timeline. */
export function describeActivity({
  actionType,
  actorRole,
  actorName,
  details,
}: {
  actionType: ActivityActionType;
  actorRole: UserRole;
  actorName?: string;
  details: unknown;
}): string {
  const parsed = (details ?? {}) as ActivityDetails;
  const actor = actorName ?? (actorRole === "ADMIN" ? "Admin" : actorRole === "BRAND" ? "Brand" : "Creator");
  const summary = summarizeChanges(parsed.changes);

  switch (actionType) {
    case "CAMPAIGN_CREATED":
      return `${actor} created this campaign.`;
    case "CAMPAIGN_SUBMITTED_FOR_REVIEW":
      return `${actor} submitted the campaign for review.`;
    case "ADMIN_APPROVED":
      return `${actor} approved the campaign.`;
    case "ADMIN_REQUESTED_CHANGES":
      return `${actor} requested changes${parsed.note ? `: "${parsed.note}"` : "."}`;
    case "ADMIN_REJECTED":
      return `${actor} rejected the campaign${parsed.note ? `: "${parsed.note}"` : "."}`;
    case "CREATOR_INTEREST_SUBMITTED":
      return `${actor} applied${summary ? ` proposing ${summary}` : ""}.`;
    case "COUNTER_OFFER_SENT":
      return `${actor} sent a counter-offer${summary ? `: ${summary}` : "."}`;
    case "COUNTER_OFFER_ACCEPTED":
      return `${actor} accepted the offer.`;
    case "COUNTER_OFFER_DECLINED":
      return `${actor} declined the application.`;
    case "TERMS_AGREED":
      return `Terms agreed${parsed.note ? ` — ${parsed.note}` : "."}`;
    case "STATUS_CHANGED":
      return `${actor} updated the status${summary ? `: ${summary}` : "."}`;
    case "DISPUTE_RAISED":
      return `${actor} raised a dispute${parsed.note ? `: "${parsed.note}"` : "."}`;
    case "DISPUTE_RESOLVED":
      return `${actor} resolved the dispute${parsed.note ? `: "${parsed.note}"` : "."}`;
    default:
      return actionType;
  }
}
