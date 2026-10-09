import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/schemas";
import { registerCreator } from "@/server/auth/accounts";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { toCreatorSummary } from "@/server/mappers";
import { signIn } from "@/server/session";
import { clientIp } from "../../_lib/client-ip";
import { handleRoute, parseJsonBody } from "../../_lib/handle-route";

const REGISTER_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export function POST(request: Request) {
  return handleRoute(async () => {
    consumeRateLimit(`register:${clientIp(request)}`, REGISTER_LIMIT);
    const input = await parseJsonBody(request, registerSchema);
    const creator = await registerCreator(input);
    await signIn(creator.id);
    return NextResponse.json({ creator: toCreatorSummary(creator) }, { status: 201 });
  });
}
