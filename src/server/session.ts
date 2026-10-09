import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { CreatorSummary } from "@/types";
import { createSession, findCreatorBySessionToken, revokeSession } from "./auth/sessions";
import { DomainError } from "./errors";
import { toCreatorSummary } from "./mappers";
import { settleSimulatedReview } from "./verification";

export const SESSION_COOKIE = "creatorhub_session";

export const getCurrentCreator = cache(async (): Promise<CreatorSummary | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const creator = await findCreatorBySessionToken(token);
  if (!creator) return null;

  return toCreatorSummary(await settleSimulatedReview(creator));
});

export async function requireCreator(): Promise<CreatorSummary> {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");
  return creator;
}

export async function requireApiCreator(): Promise<CreatorSummary> {
  const creator = await getCurrentCreator();
  if (!creator) throw new DomainError("UNAUTHENTICATED", "Your session has expired. Please sign in again.");
  return creator;
}

export async function signIn(creatorId: string) {
  const { token, expiresAt } = await createSession(creatorId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token);
  cookieStore.delete(SESSION_COOKIE);
}
