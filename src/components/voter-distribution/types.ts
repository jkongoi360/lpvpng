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
  /** Set when the ward belongs to a named group (see data/ward-groups.json). */
  groupId?: string;
  groupName?: string;
  /** Group colour, which takes precedence over the LLG colour on map pins. */
  groupColor?: string;
};

export type LlgSummary = {
  id: string;
  name: string;
  registeredVoters: number;
  wardCount: number;
};

/** Rolled-up totals for a named ward group. Derived, never stored. */
export type WardGroupSummary = {
  id: string;
  name: string;
  color: string;
  registeredVoters: number;
  wardCount: number;
  /** Group ward ids that matched no ward in this electorate — a data typo. */
  missingWardIds: string[];
};
