import { NextResponse, type NextRequest } from "next/server";
import { purchaseQuerySchema } from "@/lib/schemas";
import { listPurchases } from "@/server/purchases";
import { requireApiCreator } from "@/server/session";
import { handleRoute } from "../_lib/handle-route";

export function GET(request: NextRequest) {
  return handleRoute(async () => {
    const query = purchaseQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const creator = await requireApiCreator();
    return NextResponse.json(await listPurchases(creator.id, query));
  });
}
