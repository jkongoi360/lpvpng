"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import type { Electorate } from "@/types";
import {
  ELECTORATES_WITH_MAPS,
  ELECTORATE_MAP_CONFIGS,
  buildLlgColors,
  type ElectorateMapConfig,
} from "@/data/maps/registry";
import { buildMapWards, DEFAULT_MAP_CONFIG } from "./build-wards";
import type { ElectorateLLGData } from "@/types";

const PopulationMap = dynamic(() => import("./population-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-zinc-500">
      Loading map…
    </div>
  ),
});

const fmt = (n: number) => n.toLocaleString("en-US");

export type VoterDistributionViewProps = {
  electorates: Electorate[];
  selectedElectorate: Electorate;
  llgData: ElectorateLLGData;
  onElectorateChange: (slug: string) => void;
  /** True while the parent is fetching new LLG data after a dropdown change. */
  pending?: boolean;
};

export default function VoterDistributionView({
  electorates,
  selectedElectorate,
  llgData,
  onElectorateChange,
  pending,
}: VoterDistributionViewProps) {
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const baseConfig: ElectorateMapConfig =
    ELECTORATE_MAP_CONFIGS[selectedElectorate.slug] ?? DEFAULT_MAP_CONFIG;
  const hasMapData = ELECTORATES_WITH_MAPS.includes(selectedElectorate.slug);

  // Ensure every LLG gets a color, falling back to the palette for electorates
  // without a hand-picked scheme.
  const config: ElectorateMapConfig = useMemo(
    () => ({
      ...baseConfig,
      llgColors: buildLlgColors(
        llgData.llgs.map((l) => l.id),
        baseConfig.llgColors,
      ),
    }),
    [baseConfig, llgData],
  );

  const { wards, llgs } = useMemo(
    () => buildMapWards(llgData, config),
    [llgData, config],
  );

  const wardsByLlg = useMemo(
    () =>
      llgs.map((llg) => ({
        llg,
        wards: wards
          .filter((w) => w.llgId === llg.id)
          .sort((a, b) => b.registeredVoters - a.registeredVoters),
      })),
    [llgs, wards],
  );

  const totalVoters = wards.reduce((s, w) => s + w.registeredVoters, 0);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    setSelectedWardId(null);
    startTransition(() => onElectorateChange(slug));
  };

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[320px_1fr]">
      <aside className="overflow-y-auto border-r border-zinc-200 bg-white p-5">
        <label
          htmlFor="electorate-select"
          className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
        >
          Electorate
        </label>
        <select
          id="electorate-select"
          value={selectedElectorate.slug}
          onChange={handleSelectChange}
          className="mt-1 mb-4 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm focus:border-png-red focus:outline-none focus:ring-1 focus:ring-png-red"
        >
          {electorates.map((e) => {
            const mapped = ELECTORATES_WITH_MAPS.includes(e.slug);
            return (
              <option key={e.slug} value={e.slug}>
                {e.name}
                {mapped ? "  •  mapped" : ""}
              </option>
            );
          })}
        </select>

        <h1 className="text-lg font-bold tracking-tight text-zinc-900">
          {selectedElectorate.name}
        </h1>
        <p className="mt-0.5 mb-4 text-xs text-zinc-500">
          {fmt(totalVoters)} registered voters · {wards.length} wards · {llgs.length} LLGs
        </p>

        {!hasMapData && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            No surveyed pin positions for this electorate yet — wards are laid
            out in a synthetic spiral around an approximate center. Drag pins
            to position them, then export the JSON to seed defaults.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-5">
          <Stat label="Voters" value={fmt(totalVoters)} />
          <Stat label="Wards" value={String(wards.length)} />
          <Stat label="LLGs" value={String(llgs.length)} />
          <Stat
            label="Avg / ward"
            value={
              wards.length > 0
                ? fmt(Math.round(totalVoters / wards.length))
                : "—"
            }
          />
        </div>

        <div className="mb-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            LLGs
          </h2>
          {llgs.map((llg) => (
            <div
              key={llg.id}
              className="flex items-center gap-2 py-1 text-[13px]"
            >
              <span
                className="inline-block h-3 w-3 rounded-full border border-black/10"
                style={{
                  background: config.llgColors[llg.id] ?? "#64748b",
                }}
              />
              <span className="flex-1 truncate">{llg.name}</span>
              <span className="text-zinc-500">
                {llg.wardCount} · {fmt(llg.registeredVoters)}
              </span>
            </div>
          ))}
        </div>

        {wardsByLlg.map(({ llg, wards: llgWards }) => (
          <div key={llg.id} className="mb-3">
            <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <span
                className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                style={{
                  background: config.llgColors[llg.id] ?? "#64748b",
                }}
              />
              {llg.name}
            </h2>
            <ul className="list-none">
              {llgWards.map((w) => {
                const active = selectedWardId === w.id;
                return (
                  <li
                    key={w.id}
                    onClick={() => setSelectedWardId(w.id)}
                    title="Click to locate on the map"
                    className={`flex cursor-pointer justify-between gap-2 border-b border-zinc-100 px-1.5 py-1.5 text-[13px] transition-colors ${
                      active
                        ? "border-l-[3px] border-l-amber-500 bg-amber-50 pl-2 font-semibold text-amber-900"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <span className="truncate">{w.name}</span>
                    <span className="font-mono text-zinc-600">
                      {fmt(w.registeredVoters)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <p className="mt-4 border-t border-zinc-100 pt-3 text-[11px] leading-relaxed text-zinc-400">
          Ward and registered-voter data sourced from the PNG LPV Election
          Simulator dataset. Per-ward coordinates are seeded from saved
          overrides; wards without overrides fall back to a deterministic
          golden-angle spiral around an approximate LLG centroid.
        </p>
      </aside>

      <section className="relative h-[calc(100vh-4rem)] lg:h-auto">
        {(pending || isPending) && (
          <div className="absolute inset-x-0 top-0 z-[1000] bg-png-gold/90 px-3 py-1 text-center text-xs font-medium text-png-black">
            Loading {selectedElectorate.name}…
          </div>
        )}
        <PopulationMap
          electorateSlug={selectedElectorate.slug}
          config={config}
          llgs={llgs}
          wards={wards}
          selectedWardId={selectedWardId}
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-100 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 text-base font-bold tabular-nums text-zinc-900">
        {value}
      </div>
    </div>
  );
}
