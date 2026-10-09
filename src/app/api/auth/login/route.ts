import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { authenticate } from "@/server/auth/accounts";
import { consumeRateLimit, resetRateLimit } from "@/server/auth/rate-limit";
import { toCreatorSummary } from "@/server/mappers";
import { signIn } from "@/server/session";
import { clientIp } from "../../_lib/client-ip";
import { handleRoute, parseJsonBody } from "../../_lib/handle-route";

const LOGIN_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export function POST(request: Request) {
  return handleRoute(async () => {
    const input = await parseJsonBody(request, loginSchema);
    const limiterKey = `login:${clientIp(request)}:${input.email.toLowerCase()}`;
    consumeRateLimit(limiterKey, LOGIN_LIMIT);

    const creator = await authenticate(input);
    resetRateLimit(limiterKey);
    await signIn(creator.id);
    return NextResponse.json({ creator: toCreatorSummary(creator) });
  });
}
