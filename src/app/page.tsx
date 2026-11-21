import { getSession } from "@/lib/auth/session";
import { getDiscoveryMetadata } from "@/lib/doctors/search";
import { HomeClient } from "@/components/HomeClient";

export default async function HomePage() {
  const [session, metadata] = await Promise.all([
    getSession(),
    getDiscoveryMetadata().catch(() => ({
      specialties: [],
      cities: [],
      areas: [],
    })),
  ]);

  return (
    <HomeClient
      user={session}
      specialties={metadata.specialties}
      cities={metadata.cities}
    />
  );
}
