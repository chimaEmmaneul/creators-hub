import type { DailyMetric, DashboardOverview } from "@/types";
import { db } from "./db";

const earnedFrom = (creatorId: string) => ({
  status: "COMPLETED" as const,
  content: { creatorId },
});

function startOfUtcMonth(offsetMonths = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
}

async function revenueBetween(creatorId: string, from?: Date, to?: Date) {
  const result = await db.purchase.aggregate({
    where: { ...earnedFrom(creatorId), createdAt: { gte: from, lt: to } },
    _sum: { amountCents: true },
    _count: { _all: true },
  });
  return { cents: result._sum.amountCents ?? 0, count: result._count._all };
}

export async function getDashboardOverview(creatorId: string): Promise<DashboardOverview> {
  const thisMonth = startOfUtcMonth();
  const lastMonth = startOfUtcMonth(-1);
  const activeContent = { creatorId, deletedAt: null };

  const [allTime, current, previous, contentCount, publishedCount] = await Promise.all([
    revenueBetween(creatorId),
    revenueBetween(creatorId, thisMonth),
    revenueBetween(creatorId, lastMonth, thisMonth),
    db.content.count({ where: activeContent }),
    db.content.count({ where: { ...activeContent, status: "PUBLISHED" } }),
  ]);

  return {
    totalRevenueCents: allTime.cents,
    revenueThisMonthCents: current.cents,
    revenueLastMonthCents: previous.cents,
    purchaseCount: allTime.count,
    contentCount,
    publishedCount,
  };
}

const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

export async function getDailyMetrics(creatorId: string, days = 30): Promise<DailyMetric[]> {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - 1)));

  const purchases = await db.purchase.findMany({
    where: { ...earnedFrom(creatorId), createdAt: { gte: start } },
    select: { amountCents: true, createdAt: true },
  });

  const series = new Map<string, DailyMetric>();
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    const key = toDayKey(day);
    series.set(key, { date: key, revenueCents: 0, purchases: 0 });
  }

  for (const purchase of purchases) {
    const bucket = series.get(toDayKey(purchase.createdAt));
    if (!bucket) continue;
    bucket.revenueCents += purchase.amountCents;
    bucket.purchases += 1;
  }

  return [...series.values()];
}
