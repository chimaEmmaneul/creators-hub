import type { LoginInput, RegisterInput } from "@/lib/schemas";
import { db } from "../db";
import { DomainError } from "../errors";
import { getDummyHash, hashPassword, verifyPassword } from "./password";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function registerCreator(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const existing = await db.creator.findUnique({ where: { email } });
  if (existing) throw new DomainError("CONFLICT", "An account with this email already exists. Try signing in instead.");

  return db.creator.create({
    data: { name: input.name.trim(), email, passwordHash: await hashPassword(input.password) },
  });
}

export async function authenticate(input: LoginInput) {
  const creator = await db.creator.findUnique({ where: { email: normalizeEmail(input.email) } });
  const valid = await verifyPassword(input.password, creator?.passwordHash ?? (await getDummyHash()));
  if (!creator || !valid) throw new DomainError("INVALID_CREDENTIALS", "Email or password is incorrect.");
  return creator;
}
