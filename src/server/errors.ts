import type { ErrorCode } from "@/lib/api-contract";

export class DomainError extends Error {
  constructor(
    public readonly code: Exclude<ErrorCode, "VALIDATION_FAILED" | "INTERNAL">,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const notFound = (entity: string) => new DomainError("NOT_FOUND", `${entity} not found.`);

export const invalidState = (message: string) => new DomainError("INVALID_STATE", message);
