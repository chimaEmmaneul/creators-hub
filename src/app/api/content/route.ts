import { NextResponse } from "next/server";
import { createContentSchema } from "@/lib/schemas";
import { createContent, listContent } from "@/server/content";
import { requireApiCreator } from "@/server/session";
import { handleRoute, parseJsonBody } from "../_lib/handle-route";

export function GET() {
  return handleRoute(async () => {
    const creator = await requireApiCreator();
    return NextResponse.json({ items: await listContent(creator) });
  });
}

export function POST(request: Request) {
  return handleRoute(async () => {
    const creator = await requireApiCreator();
    const input = await parseJsonBody(request, createContentSchema);
    return NextResponse.json({ item: await createContent(creator, input) }, { status: 201 });
  });
}
