import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTOR_DISPLAY_SELECT, resolveActorDisplayName, summarizeActivityDetails } from "@/lib/activity-log";
import { buildActivityWhere, getAnomalyCounts } from "@/lib/activity-query";
import { formatDateTime, formatEnumLabel } from "@/lib/format";

const MAX_ROWS = 10_000;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const anomalies = await getAnomalyCounts();
  const where = buildActivityWhere(params, anomalies);

  const activities = await prisma.campaignActivity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    include: {
      campaign: { select: { title: true } },
      actor: { select: ACTOR_DISPLAY_SELECT },
    },
  });

  const header = ["Campaign", "Actor", "Role", "Action type", "Details", "Timestamp"];
  const rows = activities.map((activity) => [
    activity.campaign.title,
    resolveActorDisplayName(activity.actor),
    formatEnumLabel(activity.actorRole),
    formatEnumLabel(activity.actionType),
    summarizeActivityDetails(activity.details),
    formatDateTime(activity.createdAt),
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="influnz-activity-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
