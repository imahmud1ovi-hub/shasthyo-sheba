import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { normalizeBdPhone } from "@/lib/phone";

const SCRYPT_KEYLEN = 64;

export class PasswordAuthError extends Error {
  public readonly code:
    | "INVALID_CREDENTIALS"
    | "PHONE_ALREADY_REGISTERED"
    | "USER_INACTIVE";
  public readonly statusCode: number;

  constructor(
    message: string,
    code: PasswordAuthError["code"],
    statusCode = 400
  ) {
    super(message);
    this.name = "PasswordAuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const loginPasswordSchema = z.object({
  phone: z.string().min(1, "Mobile number is required."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128),
});

export const registerPasswordSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name is required (at least 2 characters).")
    .max(100),
  phone: z.string().min(1, "Mobile number is required."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128),
});

export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto
    .scryptSync(plainPassword, salt, SCRYPT_KEYLEN)
    .toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(
  plainPassword: string,
  storedHash: string | null | undefined
): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt:")) {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 3) {
    return false;
  }
  const [, salt, hashHex] = parts;
  const derived = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hashHex, "hex");
  if (derived.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
}

export async function loginWithPhoneAndPassword(rawInput: unknown) {
  const input = loginPasswordSchema.parse(rawInput);
  const phone = normalizeBdPhone(input.phone);

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new PasswordAuthError(
      "Invalid mobile number or password.",
      "INVALID_CREDENTIALS",
      401
    );
  }

  if (!user.isActive) {
    throw new PasswordAuthError(
      "This account is disabled.",
      "USER_INACTIVE",
      403
    );
  }

  return user;
}

export async function registerPatientWithPassword(rawInput: unknown) {
  const input = registerPasswordSchema.parse(rawInput);
  const phone = normalizeBdPhone(input.phone);
  const passwordHash = hashPassword(input.password);

  const existing = await prisma.user.findUnique({
    where: { phone },
  });

  if (existing && existing.passwordHash) {
    throw new PasswordAuthError(
      "An account with this mobile number already exists. Please sign in.",
      "PHONE_ALREADY_REGISTERED",
      409
    );
  }

  if (existing && !existing.passwordHash) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        nameEn: existing.nameEn || input.name,
        nameBn: existing.nameBn || input.name,
      },
    });
    return updated;
  }

  return prisma.user.create({
    data: {
      phone,
      passwordHash,
      nameEn: input.name,
      nameBn: input.name,
      role: "PATIENT",
      preferredLang: "en",
      patientProfile: {
        create: {},
      },
    },
  });
}
