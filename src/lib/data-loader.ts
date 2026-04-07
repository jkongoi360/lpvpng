import provincesData from "@/data/provinces.json";
import electoratesData from "@/data/electorates.json";
import regionalSeatsData from "@/data/regional-seats.json";
import type {
  Province,
  Electorate,
  ElectorateLLGData,
  ProvinceLLGData,
  ProvinceWithElectorates,
} from "@/types";

export function getProvinces(): Province[] {
  return provincesData as Province[];
}

export function getElectorates(): Electorate[] {
  return electoratesData as Electorate[];
}

export function getRegionalSeats(): Electorate[] {
  return regionalSeatsData as Electorate[];
}

export function getAllSeats(): Electorate[] {
  return [...getElectorates(), ...getRegionalSeats()];
}

export function getElectorateBySlug(slug: string): Electorate | undefined {
  return getAllSeats().find((e) => e.slug === slug);
}

export function getProvinceById(id: string): Province | undefined {
  return getProvinces().find((p) => p.id === id);
}

export function getElectoratesByProvince(): ProvinceWithElectorates[] {
  const provinces = getProvinces();
  const electorates = getElectorates();

  return provinces
    .map((province) => ({
      ...province,
      electorates: electorates.filter((e) => e.provinceId === province.id),
    }))
    .filter((p) => p.electorates.length > 0);
}

export function getRegionalSeatsByRegion(): Record<string, Electorate[]> {
  const seats = getRegionalSeats();
  const provinces = getProvinces();
  const result: Record<string, Electorate[]> = {};

  for (const seat of seats) {
    const province = provinces.find((p) => p.id === seat.provinceId);
    const region = province?.region ?? "Other";
    if (!result[region]) result[region] = [];
    result[region].push(seat);
  }

  return result;
}

const llgImports: Record<string, () => Promise<{ default: ProvinceLLGData }>> = {
  western: () => import("@/data/llgs/western.json"),
  gulf: () => import("@/data/llgs/gulf.json"),
  central: () => import("@/data/llgs/central.json"),
  ncd: () => import("@/data/llgs/ncd.json"),
  "milne-bay": () => import("@/data/llgs/milne-bay.json"),
  oro: () => import("@/data/llgs/oro.json"),
  "southern-highlands": () => import("@/data/llgs/southern-highlands.json"),
  hela: () => import("@/data/llgs/hela.json"),
  enga: () => import("@/data/llgs/enga.json"),
  "western-highlands": () => import("@/data/llgs/western-highlands.json"),
  jiwaka: () => import("@/data/llgs/jiwaka.json"),
  chimbu: () => import("@/data/llgs/chimbu.json"),
  "eastern-highlands": () => import("@/data/llgs/eastern-highlands.json"),
  morobe: () => import("@/data/llgs/morobe.json"),
  madang: () => import("@/data/llgs/madang.json"),
  "east-sepik": () => import("@/data/llgs/east-sepik.json"),
  sandaun: () => import("@/data/llgs/sandaun.json"),
  manus: () => import("@/data/llgs/manus.json"),
  "new-ireland": () => import("@/data/llgs/new-ireland.json"),
  "east-new-britain": () => import("@/data/llgs/east-new-britain.json"),
  "west-new-britain": () => import("@/data/llgs/west-new-britain.json"),
  arob: () => import("@/data/llgs/arob.json"),
};

export async function getLLGsForElectorate(
  electorateSlug: string
): Promise<ElectorateLLGData | undefined> {
  const electorate = getElectorateBySlug(electorateSlug);
  if (!electorate) return undefined;

  const importFn = llgImports[electorate.provinceId];
  if (!importFn) return undefined;

  const mod = await importFn();
  const data: ProvinceLLGData = mod.default ?? (mod as unknown as ProvinceLLGData);
  return data.electorates.find((e) => e.electorateSlug === electorateSlug);
}
