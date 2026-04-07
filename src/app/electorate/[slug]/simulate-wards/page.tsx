import { notFound } from "next/navigation";
import { getElectorateBySlug, getLLGsForElectorate, getElectorates } from "@/lib/data-loader";
import { WardSimulationPage } from "@/components/simulation/ward-simulation-page";

export function generateStaticParams() {
  return getElectorates().map((seat) => ({ slug: seat.slug }));
}

export default async function SimulateWardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ candidates?: string }>;
}) {
  const { slug } = await params;
  const { candidates } = await searchParams;
  const electorate = getElectorateBySlug(slug);

  if (!electorate) {
    notFound();
  }

  const llgData = await getLLGsForElectorate(slug);
  if (!llgData) {
    notFound();
  }

  const candidateCount = Math.max(2, Math.min(50, Number(candidates) || 4));

  return (
    <WardSimulationPage
      electorate={electorate}
      llgData={llgData}
      candidateCount={candidateCount}
    />
  );
}
