import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatBudget } from "@/lib/format";

/**
 * The offer trail for a negotiation, read back out of the audit log.
 *
 * The negotiation panel shows this so both sides can see how a deal got to its
 * current number — the log is already recording it, there is no reason to make
 * people remember.
 */
export interface OfferHistoryEntry {
  id: string;
  actorRole: UserRole;
  text: string;
  at: Date;
}

const OFFER_ACTIONS = [
  "CREATOR_INTEREST_SUBMITTED",
  "COUNTER_OFFER_SENT",
  "TERMS_AGREED",
  "COUNTER_OFFER_DECLINED",
] as const;

interface ActivityDetails {
  changes?: { field: string; oldValue: string | number | null; newValue: string | number | null }[];
  note?: string;
}

function describeOffer(actionType: string, details: unknown): string {
  const parsed = (details ?? {}) as ActivityDetails;
  const budget = parsed.changes?.find((change) => change.field === "budget")?.newValue;
  const amount = budget != null ? formatBudget(Number(budget)) : null;

  switch (actionType) {
    case "CREATOR_INTEREST_SUBMITTED":
      return amount ? `applied at ${amount}` : "applied";
    case "COUNTER_OFFER_SENT":
      return amount ? `countered at ${amount}` : "sent a counter-offer";
    case "TERMS_AGREED":
      return "accepted the terms";
    case "COUNTER_OFFER_DECLINED":
      return "walked away";
    default:
      return actionType;
  }
}

/** Batched so a campaign page with many applicants still makes one query. */
export async function loadOfferHistories(
  applicationIds: string[],
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<Map<string, OfferHistoryEntry[]>> {
  const histories = new Map<string, OfferHistoryEntry[]>();
  if (applicationIds.length === 0) return histories;

  const activities = await client.campaignActivity.findMany({
    where: {
      applicationId: { in: applicationIds },
      actionType: { in: [...OFFER_ACTIONS] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      applicationId: true,
      actorRole: true,
      actionType: true,
      details: true,
      createdAt: true,
    },
  });

  for (const activity of activities) {
    if (!activity.applicationId) continue;

    const entries = histories.get(activity.applicationId) ?? [];
    entries.push({
      id: activity.id,
      actorRole: activity.actorRole,
      text: describeOffer(activity.actionType, activity.details),
      at: activity.createdAt,
    });
    histories.set(activity.applicationId, entries);
  }

  return histories;
}
