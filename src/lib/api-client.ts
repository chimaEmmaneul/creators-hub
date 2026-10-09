import type { ApiErrorBody, ErrorCode, FieldErrors } from "./api-contract";

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode | "NETWORK",
    message: string,
    public readonly status: number,
    public readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isRetryable() {
    return this.code === "NETWORK" || this.status >= 500;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError("NETWORK", "You appear to be offline. Check your connection and try again.", 0);
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (response.ok) return payload as T;

  const error = (payload as ApiErrorBody | null)?.error;
  throw new ApiError(
    error?.code ?? "INTERNAL",
    error?.message ?? "Something went wrong. Please try again.",
    response.status,
    error?.fieldErrors,
  );
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
