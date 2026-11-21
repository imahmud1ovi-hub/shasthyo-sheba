import {
  getDiscoveryMetadata,
  searchApprovedDoctors,
} from "@/lib/doctors/search";
import { DoctorSearchClient } from "@/components/doctors/DoctorSearchClient";

export default async function DoctorsSearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const [searchResult, metadata] = await Promise.all([
    searchApprovedDoctors(searchParams),
    getDiscoveryMetadata(),
  ]);

  return (
    <DoctorSearchClient
      items={searchResult.items}
      pagination={searchResult.pagination}
      initialFilters={searchResult.filters}
      specialties={metadata.specialties}
      cities={metadata.cities}
      areas={metadata.areas}
    />
  );
}
