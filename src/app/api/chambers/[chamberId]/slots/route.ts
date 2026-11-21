import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getOrGenerateSlotsForChamberDate } from "@/lib/booking/slots";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
});

export async function GET(
  req: NextRequest,
  context: { params: { chamberId: string } }
) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date") ?? "";
    const { date } = querySchema.parse({ date: dateParam });

    const result = await getOrGenerateSlotsForChamberDate(
      context.params.chamberId,
      date
    );

    if (!result.chamber) {
      return apiError("NOT_FOUND", "Chamber not found.", 404);
    }

    return apiSuccess({
      chamberId: result.chamber.id,
      date,
      open: result.open,
      reason: result.reason ?? null,
      slots: result.slots,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
