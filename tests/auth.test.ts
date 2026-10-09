import { beforeEach, describe, expect, it } from "vitest";
import { seedDatabase } from "../prisma/seed-data";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { authenticate, registerCreator } from "@/server/auth/accounts";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { createSession, findCreatorBySessionToken, revokeSession } from "@/server/auth/sessions";
import { db } from "@/server/db";

beforeEach(async () => {
  await seedDatabase(db);
});

describe("passwords", () => {
  it("hashes with a random salt and verifies only the right password", async () => {
    const [first, second] = await Promise.all([hashPassword("correct horse 1"), hashPassword("correct horse 1")]);
    expect(first).not.toBe(second);
    expect(first.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse 1", first)).toBe(true);
    expect(await verifyPassword("wrong horse 1", first)).toBe(false);
  });
});

describe("accounts", () => {
  it("signs in a demo account, case-insensitively by email", async () => {
    const creator = await authenticate({ email: DEMO_ACCOUNTS[0].email.toUpperCase(), password: DEMO_PASSWORD });
    expect(creator.email).toBe(DEMO_ACCOUNTS[0].email);
  });

  it("gives the same error for an unknown email and a wrong password", async () => {
    const failure = (email: string, password: string) => authenticate({ email, password }).catch((error: unknown) => error);
    const unknown = await failure("nobody@example.com", DEMO_PASSWORD);
    const wrong = await failure(DEMO_ACCOUNTS[0].email, "not-the-password1");
    expect(unknown).toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(wrong).toMatchObject({ code: "INVALID_CREDENTIALS", message: (unknown as Error).message });
  });

  it("registers new creators as unverified and rejects duplicate emails", async () => {
    const creator = await registerCreator({ name: "New Creator", email: "New@Example.com", password: "a-good-pass-1" });
    expect(creator.verificationStatus).toBe("UNVERIFIED");
    expect(creator.email).toBe("new@example.com");
    await expect(registerCreator({ name: "Again", email: "new@example.com", password: "a-good-pass-1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("sessions", () => {
  it("stores only a hash of the token and can be revoked", async () => {
    const creator = await authenticate({ email: DEMO_ACCOUNTS[1].email, password: DEMO_PASSWORD });
    const { token } = await createSession(creator.id);
    expect(await db.session.findUnique({ where: { id: token } })).toBeNull();
    expect((await findCreatorBySessionToken(token))?.id).toBe(creator.id);
    await revokeSession(token);
    expect(await findCreatorBySessionToken(token)).toBeNull();
  });

  it("treats an expired session as signed out", async () => {
    const creator = await authenticate({ email: DEMO_ACCOUNTS[1].email, password: DEMO_PASSWORD });
    const { token } = await createSession(creator.id);
    await db.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await findCreatorBySessionToken(token)).toBeNull();
  });
});

describe("rate limiting", () => {
  it("blocks after the limit within a window", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) consumeRateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(() => consumeRateLimit(key, { limit: 3, windowMs: 60_000 })).toThrow(/Too many attempts/);
  });
});
