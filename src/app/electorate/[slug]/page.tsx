import { notFound } from "next/navigation";
import {
  getElectorateBySlug,
  getProvinceById,
  getLLGsForElectorate,
  getAllSeats,
} from "@/lib/data-loader";
import { ElectorateDetail } from "@/components/electorate/electorate-detail";

export function generateStaticParams() {
  return getAllSeats().map((seat) => ({ slug: seat.slug }));
}

export default async function ElectoratePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const electorate = getElectorateBySlug(slug);

  if (!electorate) {
    notFound();
  }

  const province = getProvinceById(electorate.provinceId);
  const llgData = await getLLGsForElectorate(slug);

  return (
    <ElectorateDetail
      electorate={electorate}
      province={province ?? null}
      llgData={llgData ?? null}
    />
  );
}
