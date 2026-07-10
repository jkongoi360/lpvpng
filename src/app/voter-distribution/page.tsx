import { notFound } from "next/navigation";
import {
  getElectorates,
  getLLGsForElectorate,
} from "@/lib/data-loader";
import { ELECTORATES_WITH_MAPS } from "@/data/maps/registry";
import VoterDistributionPage from "@/components/voter-distribution/voter-distribution-page";

export const metadata = {
  title: "Voter Distribution — SmartVoter PNG",
  description:
    "Ward-by-ward registered voter distribution map for PNG Open electorates.",
};

type SearchParams = { electorate?: string };

// Order: electorates with full map data first (alphabetical), then the rest
// (alphabetical). Lets users find the surveyed maps quickly.
function orderElectorates<T extends { slug: string; name: string }>(list: T[]) {
  const mapped = ELECTORATES_WITH_MAPS;
  const inSet = new Set(mapped);
  const withMaps = list
    .filter((e) => inSet.has(e.slug))
    .sort((a, b) => a.name.localeCompare(b.name));
  const without = list
    .filter((e) => !inSet.has(e.slug))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...withMaps, ...without];
}

export default async function VoterDistributionRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const electorates = orderElectorates(getElectorates());
  const params = await searchParams;
  const requestedSlug = params.electorate;

  // Default to the first electorate that has a real map config (Imbonggu).
  const defaultSlug =
    ELECTORATES_WITH_MAPS.find((slug) =>
      electorates.some((e) => e.slug === slug),
    ) ?? electorates[0]?.slug;

  const slug = requestedSlug ?? defaultSlug;
  const electorate = electorates.find((e) => e.slug === slug);
  if (!electorate) notFound();

  const llgData = await getLLGsForElectorate(electorate.slug);
  if (!llgData) notFound();

  return (
    <VoterDistributionPage
      electorates={electorates}
      initialElectorate={electorate}
      initialLLGData={llgData}
    />
  );
}
