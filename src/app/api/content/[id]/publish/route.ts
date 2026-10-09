import { NextResponse } from "next/server";
import { publishContent } from "@/server/content";
import { requireApiCreator } from "@/server/session";
import { handleRoute } from "../../../_lib/handle-route";

export function POST(_request: Request, { params }: RouteContext<"/api/content/[id]/publish">) {
  return handleRoute(async () => {
    const [{ id }, creator] = await Promise.all([params, requireApiCreator()]);
    return NextResponse.json({ item: await publishContent(creator, id) });
  });
}
