import type { PurchaseQuery } from "@/lib/schemas";
import type { Paginated, PurchaseItem } from "@/types";
import { db } from "./db";
import { toPurchaseItem } from "./mappers";

export async function listPurchases(
  creatorId: string,
  query: PurchaseQuery,
): Promise<Paginated<PurchaseItem>> {
  const where = { content: { creatorId }, ...(query.status && { status: query.status }) };

  const [totalItems, rows] = await Promise.all([
    db.purchase.count({ where }),
    db.purchase.findMany({
      where,
      include: { content: { select: { title: true } } },
      orderBy: [{ [query.sort]: query.order }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows.map(toPurchaseItem),
    page: query.page,
    pageSize: query.pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
  };
}
