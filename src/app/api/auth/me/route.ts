import { apiSuccess } from "@/lib/api-response";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  return apiSuccess({ user: session });
}
