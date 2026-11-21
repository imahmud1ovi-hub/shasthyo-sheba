import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/session";
import { createClinic } from "@/lib/admin/manage";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body: unknown = await req.json();
    const clinic = await createClinic(body);
    return apiSuccess({ clinic }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
