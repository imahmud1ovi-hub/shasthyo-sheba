import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { searchApprovedDoctors } from "@/lib/doctors/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const queryObj: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const result = await searchApprovedDoctors(queryObj);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
