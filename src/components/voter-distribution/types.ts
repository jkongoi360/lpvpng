// Ward enriched with the lat/lng used by the map. Coordinates come from
// `data/maps/registry.ts` overrides when available, otherwise from a synthetic
// golden-angle spiral around the matching LLG centroid.
export type Ward = {
  id: string;
  name: string;
  llgId: string;
  llgName: string;
  registeredVoters: number;
  lat: number;
  lng: number;
};

export type LlgSummary = {
  id: string;
  name: string;
  registeredVoters: number;
  wardCount: number;
};
