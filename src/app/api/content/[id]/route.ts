import { NextResponse } from "next/server";
import { updateContentSchema } from "@/lib/schemas";
import { deleteContent, getContent, updateContent } from "@/server/content";
import { requireApiCreator } from "@/server/session";
import { handleRoute, parseJsonBody } from "../../_lib/handle-route";

type Context = RouteContext<"/api/content/[id]">;

export function GET(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const [{ id }, creator] = await Promise.all([params, requireApiCreator()]);
    return NextResponse.json({ item: await getContent(creator, id) });
  });
}

export function PATCH(request: Request, { params }: Context) {
  return handleRoute(async () => {
    const [{ id }, creator] = await Promise.all([params, requireApiCreator()]);
    const input = await parseJsonBody(request, updateContentSchema);
    return NextResponse.json({ item: await updateContent(creator, id, input) });
  });
}

export function DELETE(_request: Request, { params }: Context) {
  return handleRoute(async () => {
    const [{ id }, creator] = await Promise.all([params, requireApiCreator()]);
    await deleteContent(creator, id);
    return new NextResponse(null, { status: 204 });
  });
}
