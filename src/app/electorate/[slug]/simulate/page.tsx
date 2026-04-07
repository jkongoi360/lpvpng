import { notFound } from "next/navigation";
import { getElectorateBySlug, getAllSeats } from "@/lib/data-loader";
import { SimulationPage } from "@/components/simulation/simulation-page";

export function generateStaticParams() {
  return getAllSeats().map((seat) => ({ slug: seat.slug }));
}

export default async function SimulatePage({
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

  const candidateCount = Math.max(2, Math.min(50, Number(candidates) || 4));

  return (
    <SimulationPage electorate={electorate} candidateCount={candidateCount} />
  );
}
