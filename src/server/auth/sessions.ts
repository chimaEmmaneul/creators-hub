import { createHash, randomBytes } from "node:crypto";
import { db } from "../db";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(creatorId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: hashToken(token), creatorId, expiresAt } });
  return { token, expiresAt };
}

export async function findCreatorBySessionToken(token: string) {
  const session = await db.session.findUnique({ where: { id: hashToken(token) }, include: { creator: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.creator;
}

export async function revokeSession(token: string) {
  await db.session.deleteMany({ where: { id: hashToken(token) } });
}
