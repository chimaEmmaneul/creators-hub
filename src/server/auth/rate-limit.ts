import { DomainError } from "../errors";

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export function consumeRateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const current = windows.get(key);
  const window = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  window.count += 1;
  windows.set(key, window);

  if (window.count > limit) {
    const minutes = Math.ceil((window.resetAt - now) / 60_000);
    throw new DomainError("RATE_LIMITED", `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }
}

export function resetRateLimit(key: string) {
  windows.delete(key);
}
