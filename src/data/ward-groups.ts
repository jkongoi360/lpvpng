import raw from "./ward-groups.json";

/**
 * A named set of wards inside one electorate. Groups are a *display* layer on
 * top of the LLG structure — they don't change which LLG a ward belongs to,
 * and they don't affect any voter total. A ward may sit in a group and its
 * LLG at the same time, and groups are free to span LLGs.
 */
export type WardGroup = {
  id: string;
  name: string;
  /** Pin + swatch colour. Should contrast with the electorate's LLG colours. */
  color: string;
  wardIds: string[];
};

// The JSON carries a leading "_comment" key for whoever edits it by hand;
// strip anything that isn't an array of groups.
const GROUPS: Record<string, WardGroup[]> = Object.fromEntries(
  Object.entries(raw as Record<string, unknown>).filter(
    (entry): entry is [string, WardGroup[]] => Array.isArray(entry[1]),
  ),
);

export function getWardGroups(electorateSlug: string): WardGroup[] {
  return GROUPS[electorateSlug] ?? [];
}

/** Every electorate slug that has at least one group defined. */
export function electoratesWithGroups(): string[] {
  return Object.keys(GROUPS).filter((slug) => GROUPS[slug].length > 0);
}
