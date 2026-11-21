import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import {
  getSession,
  getSessionCookieOptions,
  signSessionToken,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const updateLangSchema = z.object({
  lang: z.enum(["en", "bn"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { lang } = updateLangSchema.parse(body);

    const session = await getSession();
    if (!session) {
      return apiSuccess({ lang, persistedInDb: false });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { preferredLang: lang },
    });

    const updatedSession = { ...session, preferredLang: lang };
    const token = await signSessionToken(updatedSession);
    const response = apiSuccess({ lang, persistedInDb: true });
    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
