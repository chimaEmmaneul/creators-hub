import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/server/analytics";
import { requireApiCreator } from "@/server/session";
import { handleRoute } from "../../_lib/handle-route";

export function GET() {
  return handleRoute(async () => {
    const creator = await requireApiCreator();
    return NextResponse.json(await getDashboardOverview(creator.id));
  });
}
