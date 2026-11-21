import { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  handleApiError,
  idParamSchema,
} from "@/lib/api-response";
import { getApprovedDoctorById } from "@/lib/doctors/search";

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = idParamSchema.parse(context.params);
    const doctor = await getApprovedDoctorById(id);
    if (!doctor) {
      return apiError("NOT_FOUND", "Approved doctor not found.", 404);
    }
    return apiSuccess({ doctor });
  } catch (err) {
    return handleApiError(err);
  }
}
