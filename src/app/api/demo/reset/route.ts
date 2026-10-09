import { NextResponse } from "next/server";
import { resetDemoData } from "@/server/demo";
import { requireApiCreator, signOut } from "@/server/session";
import { handleRoute } from "../../_lib/handle-route";

export function POST() {
  return handleRoute(async () => {
    await requireApiCreator();
    await resetDemoData();
    await signOut();
    return new NextResponse(null, { status: 204 });
  });
}
