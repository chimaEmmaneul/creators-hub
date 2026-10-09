import { NextResponse } from "next/server";
import { signOut } from "@/server/session";
import { handleRoute } from "../../_lib/handle-route";

export function POST() {
  return handleRoute(async () => {
    await signOut();
    return new NextResponse(null, { status: 204 });
  });
}
