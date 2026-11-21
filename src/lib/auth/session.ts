import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type AppRole = "PATIENT" | "DOCTOR" | "ADMIN";
export type AppLang = "en" | "bn";

export interface SessionUser {
  userId: string;
  phone: string;
  role: AppRole;
  preferredLang: AppLang;
  nameEn?: string | null;
  nameBn?: string | null;
}

export const SESSION_COOKIE_NAME = "shasthyo_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16
      ? process.env.AUTH_SECRET
      : "local-dev-fallback-secret-shasthyo-sheba-32b";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    phone: user.phone,
    role: user.role,
    preferredLang: user.preferredLang,
    nameEn: user.nameEn ?? null,
    nameBn: user.nameBn ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.phone !== "string" ||
      (payload.role !== "PATIENT" &&
        payload.role !== "DOCTOR" &&
        payload.role !== "ADMIN")
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      phone: payload.phone,
      role: payload.role,
      preferredLang: payload.preferredLang === "bn" ? "bn" : "en",
      nameEn: typeof payload.nameEn === "string" ? payload.nameEn : null,
      nameBn: typeof payload.nameBn === "string" ? payload.nameBn : null,
    };
  } catch {
    return null;
  }
}

/**
 * Checks whether a user with `userRole` is allowed to access an area requiring `allowedRoles`.
 * ADMIN is always permitted across PATIENT, DOCTOR, and ADMIN areas per specification.
 */
export function isRoleAllowed(
  userRole: AppRole,
  allowedRoles: AppRole[]
): boolean {
  if (userRole === "ADMIN") return true;
  return allowedRoles.includes(userRole);
}

export function getDashboardPathForRole(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DOCTOR":
      return "/doctor/dashboard";
    case "PATIENT":
    default:
      return "/patient/dashboard";
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export class AuthorizationError extends Error {
  public readonly statusCode: number;
  public readonly code: "UNAUTHENTICATED" | "FORBIDDEN";

  constructor(
    message: string,
    code: "UNAUTHENTICATED" | "FORBIDDEN",
    statusCode: number
  ) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Server/API helper that verifies the JWT session and checks the required role(s).
 * Never rely on middleware alone — call this in server components and API routes.
 */
export async function requireRole(
  allowedRoles: AppRole | AppRole[]
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new AuthorizationError(
      "Authentication required.",
      "UNAUTHENTICATED",
      401
    );
  }
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!isRoleAllowed(session.role, roles)) {
    throw new AuthorizationError(
      "You do not have permission to access this resource.",
      "FORBIDDEN",
      403
    );
  }
  return session;
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
