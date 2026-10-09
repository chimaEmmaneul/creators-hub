import { NextResponse } from "next/server";
import { verificationStepSchema } from "@/lib/schemas";
import { getVerificationState, submitVerificationStep } from "@/server/verification";
import { requireApiCreator } from "@/server/session";
import { handleRoute, parseJsonBody } from "../_lib/handle-route";

export function GET() {
  return handleRoute(async () => {
    const creator = await requireApiCreator();
    return NextResponse.json(await getVerificationState(creator.id));
  });
}

export function POST(request: Request) {
  return handleRoute(async () => {
    const creator = await requireApiCreator();
    const input = await parseJsonBody(request, verificationStepSchema);
    return NextResponse.json(await submitVerificationStep(creator, input));
  });
}
