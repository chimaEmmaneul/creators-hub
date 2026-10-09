import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import type { ApiErrorBody, ErrorCode, FieldErrors } from "@/lib/api-contract";
import { toFieldErrors } from "@/lib/schemas";
import { DomainError } from "@/server/errors";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  NOT_VERIFIED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_STATE: 409,
  VALIDATION_FAILED: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export function errorResponse(code: ErrorCode, message: string, fieldErrors?: FieldErrors) {
  const body: ApiErrorBody = { error: { code, message, ...(fieldErrors && { fieldErrors }) } };
  return NextResponse.json(body, { status: STATUS_BY_CODE[code] });
}

class BadRequestError extends Error {}

export async function parseJsonBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }
  return schema.parse(body);
}

export async function handleRoute(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof DomainError) return errorResponse(error.code, error.message);
    if (error instanceof BadRequestError) return errorResponse("BAD_REQUEST", error.message);
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_FAILED", "Some fields need attention.", toFieldErrors(error));
    }
    console.error(error);
    return errorResponse("INTERNAL", "Something went wrong on our side. Please try again.");
  }
}
