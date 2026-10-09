import { NextResponse } from "next/server";
import { requireApiCreator } from "@/server/session";
import { handleRoute } from "../_lib/handle-route";

export function GET() {
  return handleRoute(async () => NextResponse.json(await requireApiCreator()));
}
