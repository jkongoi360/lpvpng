"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { generateBallots, runLPVCount, CANDIDATE_COLORS } from "@/lib/lpv-algorithm";
import { randomSplitTotal, randomPercentSplit } from "@/lib/random-fill";
import type {
  Electorate,
  ElectorateLLGData,
  CandidateVoteInput,
  SimulationResult,
  Candidate,
} from "@/types";

interface Props {
  electorate: Electorate;
  llgData: ElectorateLLGData;
  candidateCount: number;
}

// Per-ward: 1st, 2nd, 3rd preference vote counts per candidate
interface WardVotes {
  wardId: string;
  first: Record<number, number>;   // candidateId -> 1st pref votes
  second: Record<number, number>;  // candidateId -> 2nd pref votes
  third: Record<number, number>;   // candidateId -> 3rd pref votes
  invalid: Record<number, number>; // candidateId -> invalid votes
}

export function WardSimulationPage({ electorate, llgData, candidateCount }: Props) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [visibleRounds, setVisibleRounds] = useState(0);
  const [openRounds, setOpenRounds] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const candidateNames = useMemo(
    () =>
      Array.from({ length: candidateCount }, (_, i) => ({
        id: i + 1,
        name: `Candidate ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ""}`,
      })),
    [candidateCount]
  );

  const [names, setNames] = useState(candidateNames);

  const allWards = useMemo(
    () => llgData.llgs.flatMap((llg) => llg.wards.map((w) => ({ ...w, llgName: llg.name }))),
    [llgData]
  );

  const emptyVotes = useCallback(
    () => Object.fromEntries(candidateNames.map((c) => [c.id, 0])),
    [candidateNames]
  );

  const [wardVotes, setWardVotes] = useState<WardVotes[]>(() =>
    allWards.map((w) => ({
      wardId: w.id,
      first: emptyVotes(),
      second: emptyVotes(),
      third: emptyVotes(),
      invalid: emptyVotes(),
    }))
  );

  const getWardInvalidTotal = useCallback(
    (wardId: string) => {
      const wv = wardVotes.find((w) => w.wardId === wardId);
      return wv ? Object.values(wv.invalid).reduce((a, b) => a + b, 0) : 0;
    },
    [wardVotes]
  );

  const isWardDisputed = useCallback(
    (wardId: string) => {
      const ward = allWards.find((w) => w.id === wardId);
      const invalidTotal = getWardInvalidTotal(wardId);
      return ward ? invalidTotal >= ward.registeredVoters : false;
    },
    [allWards, getWardInvalidTotal]
  );

  function updateWardPref(
    wardId: string,
    pref: "first" | "second" | "third" | "invalid",
    candidateId: number,
    value: number
  ) {
    setWardVotes((prev) =>
      prev.map((wv) =>
        wv.wardId === wardId
          ? { ...wv, [pref]: { ...wv[pref], [candidateId]: Math.max(0, value) } }
          : wv
      )
    );
  }

  // Total invalid votes across all wards
  const totalInvalid = useMemo(
    () => wardVotes.reduce((s, wv) => s + Object.values(wv.invalid).reduce((a, b) => a + b, 0), 0),
    [wardVotes]
  );

  // Count of fully disputed wards
  const disputedWardCount = useMemo(
    () => allWards.filter((w) => isWardDisputed(w.id)).length,
    [allWards, isWardDisputed]
  );

  // Aggregate across all wards (excluding disputed wards)
  const aggregated = useMemo(() => {
    const first: Record<number, number> = {};
    const second: Record<number, number> = {};
    const third: Record<number, number> = {};
    const invalid: Record<number, number> = {};
    for (const c of candidateNames) {
      first[c.id] = 0;
      second[c.id] = 0;
      third[c.id] = 0;
      invalid[c.id] = 0;
    }
    for (const wv of wardVotes) {
      if (isWardDisputed(wv.wardId)) continue; // skip disputed wards
      for (const c of candidateNames) {
        first[c.id] += wv.first[c.id] ?? 0;
        second[c.id] += wv.second[c.id] ?? 0;
        third[c.id] += wv.third[c.id] ?? 0;
        invalid[c.id] += wv.invalid[c.id] ?? 0;
      }
    }
    return { first, second, third, invalid };
  }, [wardVotes, candidateNames, isWardDisputed]);

  const totalFirst = Object.values(aggregated.first).reduce((a, b) => a + b, 0);
  const totalSecond = Object.values(aggregated.second).reduce((a, b) => a + b, 0);
  const totalThird = Object.values(aggregated.third).reduce((a, b) => a + b, 0);
  // Valid voter target = total registered minus invalid votes
  const totalTarget = electorate.totalRegisteredVoters - totalInvalid;

  const getWardPrefTotal = useCallback(
    (wardId: string, pref: "first" | "second" | "third") => {
      const wv = wardVotes.find((w) => w.wardId === wardId);
      return wv ? Object.values(wv[pref]).reduce((a, b) => a + b, 0) : 0;
    },
    [wardVotes]
  );

  function randomFillAllWards() {
    setWardVotes(
      allWards.map((ward) => {
        const rv = ward.registeredVoters;
        const n = candidateCount;

        // Random invalid votes per candidate: ~80% chance of 0 for the ward
        const invalidPerCandidate: Record<number, number> = {};
        let totalInv = 0;
        if (Math.random() > 0.8) {
          // Generate random invalid count per candidate
          const invTotal = Math.random() < 0.02 ? rv : Math.floor(Math.random() * 0.15 * rv);
          const invSplit = randomSplitTotal(invTotal, n);
          candidateNames.forEach((c, i) => {
            invalidPerCandidate[c.id] = invSplit[i];
            totalInv += invSplit[i];
          });
        } else {
          candidateNames.forEach((c) => { invalidPerCandidate[c.id] = 0; });
        }

        const validVoters = Math.max(0, rv - totalInv);

        // If ward is disputed (invalid >= registered), zero out all votes
        if (validVoters === 0) {
          return {
            wardId: ward.id,
            first: Object.fromEntries(candidateNames.map((c) => [c.id, 0])),
            second: Object.fromEntries(candidateNames.map((c) => [c.id, 0])),
            third: Object.fromEntries(candidateNames.map((c) => [c.id, 0])),
            invalid: invalidPerCandidate,
          };
        }

        const firstVotes = randomSplitTotal(validVoters, n);
        const secondVotes: Record<number, number> = {};
        const thirdVotes: Record<number, number> = {};
        for (const c of candidateNames) {
          secondVotes[c.id] = 0;
          thirdVotes[c.id] = 0;
        }
        for (let ci = 0; ci < n; ci++) {
          const cId = candidateNames[ci].id;
          const otherIds = candidateNames.filter((o) => o.id !== cId).map((o) => o.id);
          const secondSplit = randomSplitTotal(firstVotes[ci], otherIds.length);
          const thirdSplit = randomSplitTotal(firstVotes[ci], otherIds.length);
          otherIds.forEach((oId, i) => {
            secondVotes[oId] += secondSplit[i];
            thirdVotes[oId] += thirdSplit[i];
          });
        }
        return { wardId: ward.id, first: Object.fromEntries(candidateNames.map((c, i) => [c.id, firstVotes[i]])), second: secondVotes, third: thirdVotes, invalid: invalidPerCandidate };
      })
    );
  }

  function runSimulation() {
    const wardErrors: string[] = [];
    for (const ward of allWards) {
      const wv = wardVotes.find((w) => w.wardId === ward.id);
      if (!wv) continue;

      // If ward is disputed (invalid votes >= registered voters), skip validation
      if (isWardDisputed(ward.id)) continue;

      const rv = ward.registeredVoters;
      const wardInvTotal = Object.values(wv.invalid).reduce((a, b) => a + b, 0);
      const f = Object.values(wv.first).reduce((a, b) => a + b, 0);
      const s = Object.values(wv.second).reduce((a, b) => a + b, 0);
      const t = Object.values(wv.third).reduce((a, b) => a + b, 0);
      // Rule: 1st pref + invalid = registered voters
      if (f + wardInvTotal !== rv) {
        wardErrors.push(`${ward.name}: 1st pref (${f.toLocaleString()}) + invalid (${wardInvTotal.toLocaleString()}) must equal registered voters (${rv.toLocaleString()})`);
      }
      // Rule: 2nd and 3rd only count for valid 1st pref votes
      if (s !== f) {
        wardErrors.push(`${ward.name}: 2nd pref total (${s.toLocaleString()}) must equal valid 1st pref total (${f.toLocaleString()})`);
      }
      if (t !== f) {
        wardErrors.push(`${ward.name}: 3rd pref total (${t.toLocaleString()}) must equal valid 1st pref total (${f.toLocaleString()})`);
      }
    }
    if (wardErrors.length > 0) {
      setErrors(wardErrors.slice(0, 10));
      if (wardErrors.length > 10) setErrors((p) => [...p, `...and ${wardErrors.length - 10} more`]);
      setResult(null);
      return;
    }
    setErrors([]);

    // Convert aggregated ward 2nd/3rd counts to percentage distributions
    const inputs: CandidateVoteInput[] = candidateNames.map((c) => {
      const firstTotal = aggregated.first[c.id];
      const otherIds = candidateNames.filter((o) => o.id !== c.id).map((o) => o.id);

      // For candidate c, the 2nd pref distribution = how many of c's 1st-pref voters
      // chose each other candidate as 2nd pref.
      // We compute this from the ward data: for each ward, candidate c's 1st-pref votes
      // contribute to 2nd-pref counts for others proportionally.
      // Simplified: use the aggregated 2nd pref counts to derive percentages.
      const total2nd = otherIds.reduce((s, oId) => s + (aggregated.second[oId] ?? 0), 0);
      const total3rd = otherIds.reduce((s, oId) => s + (aggregated.third[oId] ?? 0), 0);

      const secondDist: Record<number, number> = {};
      const thirdDist: Record<number, number> = {};
      for (const oId of otherIds) {
        secondDist[oId] = total2nd > 0 ? ((aggregated.second[oId] ?? 0) / total2nd) * 100 : 0;
        thirdDist[oId] = total3rd > 0 ? ((aggregated.third[oId] ?? 0) / total3rd) * 100 : 0;
      }

      return {
        candidateId: c.id,
        candidateName: names.find((n) => n.id === c.id)?.name ?? c.name,
        firstPrefVotes: firstTotal,
        secondPrefDistribution: secondDist,
        thirdPrefDistribution: thirdDist,
      };
    });

    const candidates: Candidate[] = inputs.map((inp) => ({
      id: inp.candidateId,
      name: inp.candidateName,
      color: CANDIDATE_COLORS[(inp.candidateId - 1) % CANDIDATE_COLORS.length],
    }));

    const ballots = generateBallots(inputs);
    const simResult = runLPVCount(candidates, ballots);
    setResult(simResult);
    setVisibleRounds(1);
    setOpenRounds(["round-1"]);
  }

  function showNextRound() {
    if (result && visibleRounds < result.rounds.length) {
      const next = visibleRounds + 1;
      setVisibleRounds(next);
      setOpenRounds((prev) => [...prev, `round-${next}`]);
    }
  }

  const allRoundsVisible = result !== null && visibleRounds >= result.rounds.length;
  const currentRound = result ? result.rounds[visibleRounds - 1] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2 text-sm text-zinc-500">
        <Link href="/open" className="hover:text-zinc-900">Open Seats</Link>
        {" / "}
        <Link href={`/electorate/${electorate.slug}`} className="hover:text-zinc-900">
          {electorate.name}
        </Link>
        {" / "}
        <span className="text-zinc-900">Ward-by-Ward Simulation</span>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        Ward-by-Ward Simulation &mdash; {electorate.name}
      </h1>
      <p className="text-zinc-600 mb-6">
        {candidateCount} candidates &middot;{" "}
        {electorate.totalRegisteredVoters.toLocaleString()} registered voters &middot;{" "}
        {llgData.llgs.length} LLGs &middot; {allWards.length} wards
        {totalInvalid > 0 && (
          <>
            {" "}&middot;{" "}
            <span className="text-red-600 font-medium">
              {totalInvalid.toLocaleString()} invalid votes
            </span>
            {" "}&middot;{" "}
            <span className="text-green-700 font-medium">
              {totalTarget.toLocaleString()} valid voters
            </span>
          </>
        )}
        {disputedWardCount > 0 && (
          <>
            {" "}&middot;{" "}
            <span className="text-red-700 font-semibold">
              {disputedWardCount} ward{disputedWardCount !== 1 ? "s" : ""} disputed
            </span>
          </>
        )}
      </p>

      {!result && (
        <div className="space-y-6">
          {/* Candidate Names */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Candidates</CardTitle>
              <Button variant="outline" size="sm" onClick={randomFillAllWards}>
                Random Fill All Wards
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {names.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CANDIDATE_COLORS[(c.id - 1) % CANDIDATE_COLORS.length] }}
                    />
                    <Input
                      value={c.name}
                      onChange={(e) =>
                        setNames((prev) => prev.map((n) => (n.id === c.id ? { ...n, name: e.target.value } : n)))
                      }
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Aggregated Totals Bar */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {/* 1st Pref + Invalid = Registered */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-zinc-700">1st Preference + Invalid (valid wards)</span>
                  <span className={`font-mono font-semibold ${totalFirst + totalInvalid === totalTarget ? "text-green-600" : "text-amber-600"}`}>
                    {totalFirst.toLocaleString()} + {totalInvalid.toLocaleString()} = {(totalFirst + totalInvalid).toLocaleString()} / {totalTarget.toLocaleString()}
                    {totalFirst + totalInvalid === totalTarget && " \u2713"}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div className="h-2 rounded-full flex overflow-hidden">
                    <div
                      className="h-2 bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, totalTarget > 0 ? (totalFirst / totalTarget) * 100 : 0)}%` }}
                    />
                    {totalInvalid > 0 && (
                      <div
                        className="h-2 bg-red-400 transition-all"
                        style={{ width: `${Math.min(100 - (totalTarget > 0 ? (totalFirst / totalTarget) * 100 : 0), totalTarget > 0 ? (totalInvalid / totalTarget) * 100 : 0)}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
              {disputedWardCount > 0 && (
                <div className="text-xs text-red-600 font-medium">
                  {disputedWardCount} ward{disputedWardCount !== 1 ? "s" : ""} fully disputed and excluded from count
                </div>
              )}
              {/* 2nd/3rd Prefs = valid 1st prefs only (no invalid counted) */}
              {([
                { label: "2nd Preference", total: totalSecond },
                { label: "3rd Preference", total: totalThird },
              ] as const).map(({ label, total }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-zinc-700">Total {label} (= valid 1st prefs)</span>
                    <span className={`font-mono font-semibold ${total === totalFirst ? "text-green-600" : total > totalFirst ? "text-red-600" : "text-amber-600"}`}>
                      {total.toLocaleString()} / {totalFirst.toLocaleString()}
                      {total === totalFirst && " \u2713"}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${total === totalFirst ? "bg-green-500" : total > totalFirst ? "bg-red-500" : "bg-amber-500"}`}
                      style={{ width: `${Math.min(100, totalFirst > 0 ? (total / totalFirst) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ward-by-Ward Vote Entry with 1st, 2nd, 3rd columns */}
          <Card>
            <CardHeader>
              <CardTitle>Ward Vote Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 mb-4">
                For each ward, enter the <strong>1st pref</strong> and <strong>Invalid</strong> votes
                per candidate. Each candidate&apos;s 1st pref + invalid must add up to the ward total.
                The <strong>2nd</strong> and <strong>3rd</strong> preferences are only counted for
                valid 1st preference votes (not invalid). If total invalid equals registered voters,
                the ward is marked <strong>disputed</strong> and excluded from the count.
              </p>
              <Accordion multiple>
                {llgData.llgs.map((llg) => {
                  const llgTotal = llg.wards.reduce((s, w) => s + w.registeredVoters, 0);
                  const llgFirstTotal = llg.wards.reduce((s, w) => s + getWardPrefTotal(w.id, "first"), 0);
                  const llgInvTotal = llg.wards.reduce((s, w) => s + getWardInvalidTotal(w.id), 0);
                  const llgAllocated = llgFirstTotal + llgInvTotal;
                  const llgMatch = llgAllocated === llgTotal;

                  return (
                    <AccordionItem key={llg.id} value={llg.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-3 flex-1 mr-4">
                          <span className="font-medium">{llg.name}</span>
                          <span className="text-xs text-zinc-500">{llg.wards.length} wards</span>
                          <span className={`text-xs font-mono ml-auto ${llgMatch ? "text-green-600" : "text-amber-600"}`}>
                            {llgAllocated.toLocaleString()} / {llgTotal.toLocaleString()}
                            {llgMatch && " \u2713"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6">
                          {llg.wards.map((ward) => {
                            const wv = wardVotes.find((w) => w.wardId === ward.id);
                            const wFirst = getWardPrefTotal(ward.id, "first");
                            const wSecond = getWardPrefTotal(ward.id, "second");
                            const wThird = getWardPrefTotal(ward.id, "third");
                            const rv = ward.registeredVoters;
                            const wardInvTotal = getWardInvalidTotal(ward.id);
                            const disputed = isWardDisputed(ward.id);
                            // 1st + invalid must = registered; 2nd/3rd must = 1st (valid only)
                            const firstPlusInv = wFirst + wardInvTotal;
                            const firstMatch = firstPlusInv === rv;
                            const secondMatch = wSecond === wFirst;
                            const thirdMatch = wThird === wFirst;
                            const allMatch = !disputed && firstMatch && secondMatch && thirdMatch;

                            return (
                              <div key={ward.id} className={`border rounded-lg p-3 space-y-3 ${disputed ? "border-red-400 bg-red-50/50" : ""}`}>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-zinc-800">{ward.name}</span>
                                    <span className="text-xs text-zinc-500">({rv.toLocaleString()} registered)</span>
                                    {disputed && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                        DISPUTED
                                      </Badge>
                                    )}
                                  </div>
                                  {!disputed && (
                                    <div className="flex gap-3 text-xs font-mono flex-wrap">
                                      <span className={firstMatch ? "text-green-600" : "text-amber-600"}>
                                        1st+Inv: {firstPlusInv.toLocaleString()}/{rv.toLocaleString()}{firstMatch && " \u2713"}
                                      </span>
                                      <span className={secondMatch ? "text-green-600" : "text-amber-600"}>
                                        2nd: {wSecond.toLocaleString()}/{wFirst.toLocaleString()}{secondMatch && " \u2713"}
                                      </span>
                                      <span className={thirdMatch ? "text-green-600" : "text-amber-600"}>
                                        3rd: {wThird.toLocaleString()}/{wFirst.toLocaleString()}{thirdMatch && " \u2713"}
                                      </span>
                                      {allMatch && <span className="text-green-600 font-semibold">\u2713</span>}
                                    </div>
                                  )}
                                  {disputed && (
                                    <span className="text-xs text-red-600 font-semibold">
                                      All votes in this ward are invalid / disputed
                                    </span>
                                  )}
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="min-w-[120px]">Candidate</TableHead>
                                        <TableHead className="text-right w-24">1st Pref</TableHead>
                                        <TableHead className="text-right w-24">2nd Pref</TableHead>
                                        <TableHead className="text-right w-24">3rd Pref</TableHead>
                                        <TableHead className="text-right w-24 text-red-700">Invalid</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {names.map((c) => (
                                        <TableRow key={c.id}>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: CANDIDATE_COLORS[(c.id - 1) % CANDIDATE_COLORS.length] }}
                                              />
                                              <span className="text-xs font-medium">{c.name}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Input
                                              type="number"
                                              min={0}
                                              className="w-20 text-sm ml-auto"
                                              value={wv?.first[c.id] || ""}
                                              onChange={(e) => updateWardPref(ward.id, "first", c.id, Number(e.target.value) || 0)}
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Input
                                              type="number"
                                              min={0}
                                              className="w-20 text-sm ml-auto"
                                              value={wv?.second[c.id] || ""}
                                              onChange={(e) => updateWardPref(ward.id, "second", c.id, Number(e.target.value) || 0)}
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Input
                                              type="number"
                                              min={0}
                                              className="w-20 text-sm ml-auto"
                                              value={wv?.third[c.id] || ""}
                                              onChange={(e) => updateWardPref(ward.id, "third", c.id, Number(e.target.value) || 0)}
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Input
                                              type="number"
                                              min={0}
                                              className="w-20 text-sm ml-auto border-red-200 text-red-700"
                                              value={wv?.invalid[c.id] || ""}
                                              onChange={(e) => updateWardPref(ward.id, "invalid", c.id, Number(e.target.value) || 0)}
                                              placeholder="0"
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      <TableRow className="border-t font-semibold text-xs">
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-right font-mono">
                                          {wFirst.toLocaleString()}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${secondMatch ? "text-green-600" : "text-amber-600"}`}>
                                          {wSecond.toLocaleString()}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${thirdMatch ? "text-green-600" : "text-amber-600"}`}>
                                          {wThird.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-red-700">
                                          {wardInvTotal > 0 ? wardInvTotal.toLocaleString() : 0}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow className="text-xs bg-zinc-50">
                                        <TableCell className="font-medium text-zinc-600">1st + Invalid</TableCell>
                                        <TableCell colSpan={3} className={`text-right font-mono font-semibold ${firstMatch ? "text-green-600" : "text-red-600"}`}>
                                          {wFirst.toLocaleString()} + {wardInvTotal.toLocaleString()} = {firstPlusInv.toLocaleString()} / {rv.toLocaleString()}
                                          {firstMatch && " \u2713"}
                                        </TableCell>
                                        <TableCell />
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Aggregated Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Aggregated Summary (All Wards)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Total 1st Pref</TableHead>
                    <TableHead className="text-right text-red-700">Invalid</TableHead>
                    <TableHead className="text-right">Total 2nd Pref</TableHead>
                    <TableHead className="text-right">Total 3rd Pref</TableHead>
                    <TableHead className="text-right">% (1st)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {names.map((c) => {
                    const f = aggregated.first[c.id];
                    const inv = aggregated.invalid[c.id];
                    const s = aggregated.second[c.id];
                    const t = aggregated.third[c.id];
                    const pct = totalFirst > 0 ? (f / totalFirst) * 100 : 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: CANDIDATE_COLORS[(c.id - 1) % CANDIDATE_COLORS.length] }}
                            />
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{f.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">{inv > 0 ? inv.toLocaleString() : "-"}</TableCell>
                        <TableCell className="text-right font-mono">{s.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{t.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{pct.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className={`text-right font-mono ${totalFirst + totalInvalid === totalTarget ? "text-green-600" : "text-red-600"}`}>
                      {totalFirst.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-700">
                      {totalInvalid.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${totalSecond === totalFirst ? "text-green-600" : "text-red-600"}`}>
                      {totalSecond.toLocaleString()}
                      {totalSecond === totalFirst ? " \u2713" : ""}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${totalThird === totalFirst ? "text-green-600" : "text-red-600"}`}>
                      {totalThird.toLocaleString()}
                      {totalThird === totalFirst ? " \u2713" : ""}
                    </TableCell>
                    <TableCell className="text-right text-xs font-normal text-zinc-500">
                      2nd/3rd = 1st pref only
                    </TableCell>
                  </TableRow>
                  <TableRow className="text-xs bg-zinc-50">
                    <TableCell className="font-medium text-zinc-600">1st + Invalid</TableCell>
                    <TableCell colSpan={2} className={`text-right font-mono font-semibold ${totalFirst + totalInvalid === totalTarget ? "text-green-600" : "text-red-600"}`}>
                      {totalFirst.toLocaleString()} + {totalInvalid.toLocaleString()} = {(totalFirst + totalInvalid).toLocaleString()} / {totalTarget.toLocaleString()}
                      {totalFirst + totalInvalid === totalTarget && " \u2713"}
                    </TableCell>
                    <TableCell colSpan={3} className="text-right text-zinc-500">
                      Invalid votes not counted for 2nd/3rd preferences
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800 mb-2">Please fix the following errors:</p>
              <ul className="list-disc ml-4 text-sm text-red-700 space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="w-full bg-png-red hover:bg-png-red/90 text-white text-lg py-6"
            onClick={runSimulation}
          >
            Run LPV Count
          </Button>
        </div>
      )}

      {/* Results Section */}
      {result && visibleRounds > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Round-by-Round Results
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  (Round {visibleRounds} of {result.rounds.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion multiple value={openRounds} onValueChange={(val) => setOpenRounds(val as string[])}>
                {result.rounds.slice(0, visibleRounds).map((round) => {
                  const isWinningRound = round.winnerId !== null;
                  const showTransfers = round.roundNumber > 1;
                  const totalLive = Object.values(round.tallies).reduce((a, b) => a + b, 0);
                  const grandTotal = totalLive + round.totalExhausted;
                  const balances = grandTotal === result.totalFormalVotes;

                  return (
                    <AccordionItem key={round.roundNumber} value={`round-${round.roundNumber}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 flex-1 mr-4">
                          <span className="font-semibold">Round {round.roundNumber}</span>
                          {round.eliminatedCandidateId !== null && (
                            <Badge variant="destructive" className="text-xs">
                              Eliminated: {result.candidates.find((c) => c.id === round.eliminatedCandidateId)?.name}
                            </Badge>
                          )}
                          {isWinningRound && (
                            <Badge className="bg-png-gold text-black text-xs">
                              Winner: {result.candidates.find((c) => c.id === round.winnerId)?.name}
                            </Badge>
                          )}
                          <span className="text-xs text-zinc-500 ml-auto">
                            Majority: {round.majorityThreshold.toLocaleString()}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Candidate</TableHead>
                              {showTransfers && (
                                <>
                                  <TableHead className="text-right">Prev.</TableHead>
                                  <TableHead className="text-right">+ Transfer</TableHead>
                                </>
                              )}
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right">%</TableHead>
                              <TableHead className="w-32">Progress</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(round.tallies)
                              .sort(([, a], [, b]) => b - a)
                              .map(([idStr, votes]) => {
                                const id = Number(idStr);
                                const candidate = result.candidates.find((c) => c.id === id);
                                const pct = totalLive > 0 ? (votes / totalLive) * 100 : 0;
                                const barPct = Math.min(100, (votes / round.majorityThreshold) * 100);
                                const isEliminated = round.eliminatedCandidateId === id;
                                const isWinner = round.winnerId === id;
                                const prevVotes = round.previousTallies[id] ?? 0;
                                const transferred = round.transfersReceived[id] ?? 0;
                                const detail = round.transferDetail?.[id];

                                return (
                                  <TableRow key={id} className={isEliminated ? "bg-red-50" : isWinner ? "bg-green-50" : ""}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: candidate?.color }} />
                                        <span className="font-medium">{candidate?.name}</span>
                                      </div>
                                    </TableCell>
                                    {showTransfers && (
                                      <>
                                        <TableCell className="text-right font-mono">{prevVotes.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono">
                                          {transferred > 0 ? (
                                            <div>
                                              <span className="text-green-700 font-semibold">+{transferred.toLocaleString()}</span>
                                              <div className="text-[10px] leading-tight mt-0.5 text-zinc-500 font-normal">
                                                {(detail?.second ?? 0) > 0 && <span className="text-blue-600">{detail!.second.toLocaleString()} 2nd</span>}
                                                {(detail?.second ?? 0) > 0 && (detail?.third ?? 0) > 0 && <br />}
                                                {(detail?.third ?? 0) > 0 && <span className="text-purple-600">{detail!.third.toLocaleString()} 3rd</span>}
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-zinc-400">0</span>
                                          )}
                                        </TableCell>
                                      </>
                                    )}
                                    <TableCell className="text-right font-mono font-semibold">{votes.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono">{pct.toFixed(1)}%</TableCell>
                                    <TableCell>
                                      <div className="w-full bg-zinc-100 rounded-full h-2.5">
                                        <div className="h-2.5 rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: candidate?.color }} />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {isWinner && <Badge className="bg-png-gold text-black">Winner</Badge>}
                                      {isEliminated && <Badge variant="destructive">Eliminated</Badge>}
                                      {!isWinner && !isEliminated && <Badge variant="outline">Active</Badge>}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            <TableRow className="bg-zinc-50">
                              <TableCell><span className="text-zinc-500 font-medium">Exhausted</span></TableCell>
                              {showTransfers && (
                                <>
                                  <TableCell className="text-right font-mono text-zinc-500">{(round.totalExhausted - round.exhausted).toLocaleString()}</TableCell>
                                  <TableCell className="text-right font-mono">
                                    {round.exhausted > 0 ? <span className="text-amber-600">+{round.exhausted.toLocaleString()}</span> : <span className="text-zinc-400">0</span>}
                                  </TableCell>
                                </>
                              )}
                              <TableCell className="text-right font-mono text-zinc-500 font-semibold">{round.totalExhausted.toLocaleString()}</TableCell>
                              <TableCell /><TableCell /><TableCell />
                            </TableRow>
                            <TableRow className="border-t-2 font-semibold">
                              <TableCell>Total</TableCell>
                              {showTransfers && <><TableCell /><TableCell /></>}
                              <TableCell className="text-right font-mono">{grandTotal.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono">
                                {balances
                                  ? <span className="text-green-600">= {result.totalFormalVotes.toLocaleString()} &#10003;</span>
                                  : <span className="text-red-600">&#8800; {result.totalFormalVotes.toLocaleString()}</span>}
                              </TableCell>
                              <TableCell colSpan={2}><span className="text-xs font-normal text-zinc-500">Active + exhausted = registered</span></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        {/* Transfer breakdown explanation */}
                        {round.eliminatedCandidateId !== null && (() => {
                          const elimName = result.candidates.find((c) => c.id === round.eliminatedCandidateId)?.name;
                          const prevEliminated = result.rounds
                            .filter((r) => r.roundNumber < round.roundNumber && r.eliminatedCandidateId !== null)
                            .map((r) => result.candidates.find((c) => c.id === r.eliminatedCandidateId)?.name)
                            .filter(Boolean);

                          const transferRows = Object.entries(round.transferDetail ?? {})
                            .filter(([, d]) => d.second > 0 || d.third > 0)
                            .map(([idStr, d]) => ({
                              name: result.candidates.find((c) => c.id === Number(idStr))?.name ?? `#${idStr}`,
                              second: d.second,
                              third: d.third,
                            }))
                            .sort((a, b) => (b.second + b.third) - (a.second + a.third));

                          return (
                            <div className="mt-3 text-sm text-zinc-600 bg-zinc-50 rounded-lg p-3 space-y-2">
                              <p>
                                <span className="font-medium">{elimName}</span> eliminated
                                with {round.tallies[round.eliminatedCandidateId!]?.toLocaleString()} votes.{" "}
                                <span className="text-green-700 font-medium">{round.redistributed.toLocaleString()}</span> redistributed.
                                {round.exhausted > 0 && (
                                  <> <span className="text-amber-700 font-medium">{round.exhausted.toLocaleString()}</span> exhausted.</>
                                )}
                              </p>
                              {transferRows.length > 0 && (
                                <div className="border-t pt-2 space-y-1.5">
                                  <p className="text-xs font-semibold text-zinc-700">Transfer breakdown:</p>
                                  {transferRows.map((row) => (
                                    <div key={row.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                                      <span className="font-medium text-zinc-800 min-w-24">{row.name}:</span>
                                      {row.second > 0 && (
                                        <span className="text-blue-600">
                                          +{row.second.toLocaleString()} as 2nd pref
                                          <span className="text-zinc-400"> from {elimName}</span>
                                        </span>
                                      )}
                                      {row.third > 0 && (
                                        <span className="text-purple-600">
                                          +{row.third.toLocaleString()} as 3rd pref
                                          <span className="text-zinc-400">
                                            {" "}from {prevEliminated.length > 0
                                              ? `${prevEliminated.join("/")} voters via ${elimName}`
                                              : elimName}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Winner explanation */}
                        {isWinningRound && showTransfers && (
                          <div className="mt-3 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                            <p>
                              After redistribution, <span className="font-semibold text-green-800">
                                {result.candidates.find((c) => c.id === round.winnerId)?.name}
                              </span> reaches {Object.values(round.tallies).reduce((max, v) => Math.max(max, v), 0).toLocaleString()} votes,
                              exceeding the majority threshold of {round.majorityThreshold.toLocaleString()}.
                            </p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {!allRoundsVisible && (
            <Button className="w-full bg-png-red hover:bg-png-red/90 text-white text-lg py-6" onClick={showNextRound}>
              {currentRound?.eliminatedCandidateId !== null
                ? `Next Count (Round ${visibleRounds + 1} — redistribute ${result.candidates.find((c) => c.id === currentRound?.eliminatedCandidateId)?.name}'s votes)`
                : `Next Count (Round ${visibleRounds + 1})`}
            </Button>
          )}

          {allRoundsVisible && (
            <Card className="border-2 border-png-gold bg-gradient-to-r from-png-gold/10 to-transparent">
              <CardContent className="py-8 text-center">
                <p className="text-sm font-medium text-zinc-500 mb-1">Winner</p>
                <h2 className="text-3xl font-bold text-zinc-900">
                  {result.candidates.find((c) => c.id === result.winnerId)?.name}
                </h2>
                <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                  <Badge variant="secondary" className="text-base px-3 py-1">{result.winnerVotes.toLocaleString()} votes</Badge>
                  <Badge variant="secondary" className="text-base px-3 py-1">{result.winnerPercentage.toFixed(1)}%</Badge>
                  <Badge variant="secondary" className="text-base px-3 py-1">Won in Round {result.rounds.length}</Badge>
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  Total formal votes: {result.totalFormalVotes.toLocaleString()} &middot;
                  Exhausted: {result.rounds[result.rounds.length - 1].totalExhausted.toLocaleString()}
                  {totalInvalid > 0 && <> &middot; Invalid: {totalInvalid.toLocaleString()}</>}
                  {disputedWardCount > 0 && <> &middot; Disputed wards: {disputedWardCount}</>}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => { setResult(null); setVisibleRounds(0); setOpenRounds([]); }}>
              Modify Inputs
            </Button>
            <Link href={`/electorate/${electorate.slug}`}>
              <Button variant="outline">Back to Electorate</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
