import { getSession } from "@/lib/auth/session";
import { UnauthorizedClient } from "@/components/UnauthorizedClient";

export default async function UnauthorizedPage() {
  const session = await getSession();
  return <UnauthorizedClient user={session} />;
}
