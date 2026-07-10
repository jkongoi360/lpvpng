"use client";

import { useEffect, useState, useTransition } from "react";
import type { Electorate, ElectorateLLGData } from "@/types";
import VoterDistributionView from "./voter-distribution-view";

export default function VoterDistributionPage({
  electorates,
  initialElectorate,
  initialLLGData,
}: {
  electorates: Electorate[];
  initialElectorate: Electorate;
  initialLLGData: ElectorateLLGData;
}) {
  const [electorate, setElectorate] = useState<Electorate>(initialElectorate);
  const [llgData, setLLGData] = useState<ElectorateLLGData>(initialLLGData);
  const [isPending, startTransition] = useTransition();

  // Sync URL ?electorate=<slug> so links are shareable.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("electorate") !== electorate.slug) {
      url.searchParams.set("electorate", electorate.slug);
      window.history.replaceState({}, "", url.toString());
    }
  }, [electorate.slug]);

  const handleElectorateChange = (slug: string) => {
    const next = electorates.find((e) => e.slug === slug);
    if (!next) return;
    startTransition(async () => {
      const res = await fetch(`/api/electorate-llgs?slug=${slug}`);
      if (!res.ok) {
        // Leave the current selection alone on failure; show an alert.
        const err = await res.text().catch(() => "");
        alert(
          `Could not load LLG data for ${next.name}: ${err || res.status}.`,
        );
        return;
      }
      const data: ElectorateLLGData = await res.json();
      setElectorate(next);
      setLLGData(data);
    });
  };

  return (
    <VoterDistributionView
      electorates={electorates}
      selectedElectorate={electorate}
      llgData={llgData}
      onElectorateChange={handleElectorateChange}
      pending={isPending}
    />
  );
}
