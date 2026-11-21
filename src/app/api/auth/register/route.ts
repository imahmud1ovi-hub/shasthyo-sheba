import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { registerPatientWithPassword } from "@/lib/auth/password";
import {
  getDashboardPathForRole,
  getSessionCookieOptions,
  signSessionToken,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const user = await registerPatientWithPassword(body);

    const sessionUser = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      preferredLang: user.preferredLang,
      nameEn: user.nameEn,
      nameBn: user.nameBn,
    };

    const token = await signSessionToken(sessionUser);
    const response = apiSuccess(
      {
        user: sessionUser,
        redirectTo: getDashboardPathForRole(user.role),
      },
      201
    );

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
