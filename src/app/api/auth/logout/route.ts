import { apiSuccess } from "@/lib/api-response";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
