import type { ActivityActionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ActivityFilters {
  actionType?: string;
  from?: string;
  to?: string;
  search?: string;
  anomaly?: string;
}

export const ACTION_TYPES: ActivityActionType[] = [
  "CAMPAIGN_CREATED",
  "CAMPAIGN_SUBMITTED_FOR_REVIEW",
  "ADMIN_APPROVED",
  "ADMIN_REQUESTED_CHANGES",
  "ADMIN_REJECTED",
  "CREATOR_INTEREST_SUBMITTED",
  "COUNTER_OFFER_SENT",
  "COUNTER_OFFER_ACCEPTED",
  "COUNTER_OFFER_DECLINED",
  "TERMS_AGREED",
  "STATUS_CHANGED",
  "DISPUTE_RAISED",
  "DISPUTE_RESOLVED",
];

const STALE_PENDING_HOURS = 48;
// The negotiation cap (lib/application-status.ts) tops out at round 3 (initial + 2 counters),
// so "more than 3 counter-offer rounds" can never occur here — we flag negotiations that hit
// the cap instead, which is the closest real equivalent of "stuck negotiation."
const EXTENDED_NEGOTIATION_ROUND = 3;

export interface AnomalyCounts {
  extendedNegotiation: { count: number; campaignIds: string[] };
  dispute: { count: number; campaignIds: string[] };
  stalePending: { count: number; campaignIds: string[] };
}

export async function getAnomalyCounts(): Promise<AnomalyCounts> {
  const cutoff = new Date(Date.now() - STALE_PENDING_HOURS * 60 * 60 * 1000);

  const [extendedApps, disputeActivities, stalePending] = await Promise.all([
    prisma.application.findMany({
      where: { round: { gte: EXTENDED_NEGOTIATION_ROUND } },
      select: { campaignId: true },
    }),
    prisma.campaignActivity.findMany({
      where: { actionType: "DISPUTE_RAISED" },
      select: { campaignId: true },
    }),
    prisma.campaign.findMany({
      where: { status: "PENDING_REVIEW", createdAt: { lt: cutoff } },
      select: { id: true },
    }),
  ]);

  const extendedIds = [...new Set(extendedApps.map((a) => a.campaignId))];
  const disputeIds = [...new Set(disputeActivities.map((a) => a.campaignId))];
  const stalePendingIds = stalePending.map((c) => c.id);

  return {
    extendedNegotiation: { count: extendedIds.length, campaignIds: extendedIds },
    dispute: { count: disputeIds.length, campaignIds: disputeIds },
    stalePending: { count: stalePendingIds.length, campaignIds: stalePendingIds },
  };
}

export function buildActivityWhere(
  filters: ActivityFilters,
  anomalies?: AnomalyCounts,
): Prisma.CampaignActivityWhereInput {
  const where: Prisma.CampaignActivityWhereInput = {};

  if (filters.actionType && ACTION_TYPES.includes(filters.actionType as ActivityActionType)) {
    where.actionType = filters.actionType as ActivityActionType;
  }

  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }

  if (filters.search) {
    where.OR = [
      { campaign: { title: { contains: filters.search, mode: "insensitive" } } },
      { actor: { email: { contains: filters.search, mode: "insensitive" } } },
      { actor: { creatorProfile: { name: { contains: filters.search, mode: "insensitive" } } } },
      { actor: { brandProfile: { name: { contains: filters.search, mode: "insensitive" } } } },
    ];
  }

  if (filters.anomaly && anomalies) {
    const campaignIds =
      filters.anomaly === "extended_negotiation"
        ? anomalies.extendedNegotiation.campaignIds
        : filters.anomaly === "dispute"
          ? anomalies.dispute.campaignIds
          : filters.anomaly === "stale_pending"
            ? anomalies.stalePending.campaignIds
            : null;

    if (campaignIds) {
      where.campaignId = { in: campaignIds.length > 0 ? campaignIds : ["__none__"] };
    }
  }

  return where;
}
