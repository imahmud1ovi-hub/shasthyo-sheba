import { NextRequest, NextResponse } from "next/server";
import {
  AppRole,
  isRoleAllowed,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

const PROTECTED_PREFIXES: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/doctor", roles: ["DOCTOR"] },
  { prefix: "/patient", roles: ["PATIENT"] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedRule = PROTECTED_PREFIXES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );

  if (!matchedRule) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isRoleAllowed(session.role, matchedRule.roles)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/admin/:path*"],
};
