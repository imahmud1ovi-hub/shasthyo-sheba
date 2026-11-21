import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requestOtpForPhone } from "@/lib/auth/otp";

const requestOtpSchema = z.object({
  phone: z.string().min(1, "Phone number is required."),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { phone } = requestOtpSchema.parse(body);

    const result = await requestOtpForPhone(phone);

    return apiSuccess({
      phone: result.phone,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
