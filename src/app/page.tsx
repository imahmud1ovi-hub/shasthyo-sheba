import { getSession } from "@/lib/auth/session";
import { HomeClient } from "@/components/HomeClient";

export default async function HomePage() {
  const session = await getSession();
  return <HomeClient user={session} />;
}
