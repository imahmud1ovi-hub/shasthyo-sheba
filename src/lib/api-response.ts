import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/auth/session";
import { OtpError } from "@/lib/auth/otp";
import { BookingError } from "@/lib/booking/appointments";

export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessBody<T> {
  ok: true;
  data: T;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessBody<T>>({ ok: true, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json<ApiErrorBody>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return apiError(
      "VALIDATION_ERROR",
      firstIssue?.message ?? "Invalid input data.",
      400,
      err.issues
    );
  }

  if (err instanceof AuthorizationError) {
    return apiError(err.code, err.message, err.statusCode);
  }

  if (err instanceof OtpError) {
    return apiError(err.code, err.message, err.statusCode);
  }

  if (err instanceof BookingError) {
    return apiError(err.code, err.message, err.statusCode);
  }

  console.error("[API Error]", err);
  return apiError(
    "INTERNAL_ERROR",
    "An unexpected server error occurred.",
    500
  );
}
