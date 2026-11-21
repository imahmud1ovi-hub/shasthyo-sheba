import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { createSpecialty } from "@/lib/admin/manage";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body: unknown = await req.json();
    const specialty = await createSpecialty(body);
    return apiSuccess({ specialty }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
