import type { ElectorateLLGData } from "@/types";
import type { ElectorateMapConfig, LatLng } from "@/data/maps/registry";
import type { WardGroup } from "@/data/ward-groups";
import type { LlgSummary, Ward, WardGroupSummary } from "./types";

// Vogel sunflower / golden-angle placement — deterministic and visually even.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function spiralOffset(index: number, total: number, spread: number) {
  const r = Math.sqrt((index + 0.5) / total) * spread;
  const theta = index * GOLDEN_ANGLE;
  return { dLat: r * Math.cos(theta), dLng: r * Math.sin(theta) };
}

// Fallback when the registry has no centroid for an LLG: scatter wards in a
// small spiral around the electorate's overall map center.
const DEFAULT_SPREAD = 0.05;

export function buildMapWards(
  data: ElectorateLLGData,
  config: ElectorateMapConfig,
  groups: WardGroup[] = [],
): { wards: Ward[]; llgs: LlgSummary[]; groups: WardGroupSummary[] } {
  const wards: Ward[] = [];
  const llgs: LlgSummary[] = [];

  // ward id → the group that claims it. First group wins if two groups list
  // the same ward, so a copy-paste mistake can't make a pin flicker between
  // colours depending on iteration order.
  const groupByWardId = new Map<string, WardGroup>();
  for (const g of groups) {
    for (const id of g.wardIds) {
      if (!groupByWardId.has(id)) groupByWardId.set(id, g);
    }
  }

  for (const llg of data.llgs) {
    const center: LatLng = config.llgCenters[llg.id] ?? config.electorateCenter;
    const spread = config.llgSpread[llg.id] ?? DEFAULT_SPREAD;
    const total = llg.wards.length;

    let registered = 0;
    llg.wards.forEach((w, i) => {
      registered += w.registeredVoters;

      const group = groupByWardId.get(w.id);
      const base = {
        id: w.id,
        name: w.name,
        llgId: llg.id,
        llgName: llg.name,
        registeredVoters: w.registeredVoters,
        ...(group
          ? { groupId: group.id, groupName: group.name, groupColor: group.color }
          : {}),
      };

      const ov = config.overrides?.[w.id];
      if (ov) {
        wards.push({ ...base, lat: ov[0], lng: ov[1] });
        return;
      }

      const { dLat, dLng } = spiralOffset(i, total, spread);
      // Longitude is squished slightly because 1° lng ≈ cos(lat) × 1° lat.
      wards.push({
        ...base,
        lat: center[0] + dLat,
        lng: center[1] + dLng / Math.cos((center[0] * Math.PI) / 180),
      });
    });

    llgs.push({
      id: llg.id,
      name: llg.name,
      registeredVoters: registered,
      wardCount: total,
    });
  }

  // Roll up group totals from the wards we actually built, so the numbers can
  // never drift from the ward data. Ids that matched nothing are surfaced
  // rather than silently ignored — that's a typo in ward-groups.json.
  const byId = new Map(wards.map((w) => [w.id, w]));
  const groupSummaries: WardGroupSummary[] = groups.map((g) => {
    const present = g.wardIds.filter((id) => byId.has(id));
    return {
      id: g.id,
      name: g.name,
      color: g.color,
      wardCount: present.length,
      registeredVoters: present.reduce(
        (sum, id) => sum + (byId.get(id)?.registeredVoters ?? 0),
        0,
      ),
      missingWardIds: g.wardIds.filter((id) => !byId.has(id)),
    };
  });

  return { wards, llgs, groups: groupSummaries };
}

// A safe default config for electorates without a registered map config —
// drops markers in a single spiral around an arbitrary PNG center.
export const DEFAULT_MAP_CONFIG: ElectorateMapConfig = {
  electorateCenter: [-6.5, 145.0],
  defaultZoom: 7,
  llgCenters: {},
  llgSpread: {},
  llgColors: {},
};
