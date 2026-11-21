import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { verifyOtpForPhone } from "@/lib/auth/otp";
import {
  getDashboardPathForRole,
  getSessionCookieOptions,
  signSessionToken,
} from "@/lib/auth/session";

const verifyOtpSchema = z.object({
  phone: z.string().min(1, "Phone number is required."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be a 6-digit number."),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { phone, code } = verifyOtpSchema.parse(body);

    const user = await verifyOtpForPhone(phone, code);

    const sessionUser = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      preferredLang: user.preferredLang,
      nameEn: user.nameEn,
      nameBn: user.nameBn,
    };

    const token = await signSessionToken(sessionUser);
    const response = apiSuccess({
      user: sessionUser,
      redirectTo: getDashboardPathForRole(user.role),
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
