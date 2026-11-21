import { prisma } from "@/lib/db/prisma";
import { normalizeBdPhone } from "@/lib/phone";
import { smsProvider, SmsProvider } from "@/lib/sms/sms-provider";
import crypto from "crypto";

export const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;

export class OtpError extends Error {
  public readonly code:
    | "RATE_LIMITED"
    | "INVALID_OTP"
    | "EXPIRED_OTP"
    | "USER_INACTIVE";
  public readonly statusCode: number;

  constructor(
    message: string,
    code: "RATE_LIMITED" | "INVALID_OTP" | "EXPIRED_OTP" | "USER_INACTIVE",
    statusCode = 400
  ) {
    super(message);
    this.name = "OtpError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function generateSixDigitOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}

export async function requestOtpForPhone(
  rawPhone: string,
  provider: SmsProvider = smsProvider,
  now: Date = new Date()
): Promise<{ phone: string; expiresAt: Date }> {
  const phone = normalizeBdPhone(rawPhone);
  const oneHourAgo = new Date(now.getTime() - OTP_RATE_LIMIT_WINDOW_MS);

  const recentSendCount = await prisma.otpVerification.count({
    where: {
      phone,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  if (recentSendCount >= OTP_MAX_SENDS_PER_HOUR) {
    throw new OtpError(
      "Too many OTP requests. Maximum 5 OTPs per hour per phone number.",
      "RATE_LIMITED",
      429
    );
  }

  const code = generateSixDigitOtp();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  await prisma.otpVerification.create({
    data: {
      phone,
      code,
      expiresAt,
    },
  });

  await provider.sendOtp(phone, code);

  return { phone, expiresAt };
}

export async function verifyOtpForPhone(
  rawPhone: string,
  codeInput: string,
  now: Date = new Date()
) {
  const phone = normalizeBdPhone(rawPhone);
  const trimmedCode = codeInput.trim();

  const latestOtp = await prisma.otpVerification.findFirst({
    where: {
      phone,
      verifiedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestOtp) {
    throw new OtpError("Invalid or expired OTP code.", "INVALID_OTP", 400);
  }

  if (latestOtp.expiresAt.getTime() < now.getTime()) {
    throw new OtpError(
      "OTP code has expired. Please request a new OTP.",
      "EXPIRED_OTP",
      400
    );
  }

  if (latestOtp.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    throw new OtpError(
      "Too many incorrect attempts. Please request a new OTP.",
      "RATE_LIMITED",
      429
    );
  }

  if (latestOtp.code !== trimmedCode) {
    await prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new OtpError("Incorrect OTP code.", "INVALID_OTP", 400);
  }

  await prisma.otpVerification.update({
    where: { id: latestOtp.id },
    data: { verifiedAt: now },
  });

  let user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        role: "PATIENT",
        preferredLang: "en",
        nameEn: "Patient",
        nameBn: "রোগী",
        patientProfile: {
          create: {},
        },
      },
    });
  }

  if (!user.isActive) {
    throw new OtpError("This account is disabled.", "USER_INACTIVE", 403);
  }

  return user;
}
