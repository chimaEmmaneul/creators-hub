export const ERROR_CODES = [
  "BAD_REQUEST",
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS",
  "NOT_FOUND",
  "NOT_VERIFIED",
  "CONFLICT",
  "INVALID_STATE",
  "RATE_LIMITED",
  "INTERNAL",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export type FieldErrors = Record<string, string[] | undefined>;

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fieldErrors?: FieldErrors;
  };
}
