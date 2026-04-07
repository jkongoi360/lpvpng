"use client";

import { useState, useMemo } from "react";
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
import { validateVoteInputs } from "@/lib/validation";
import { randomSplitTotal, randomPercentSplit } from "@/lib/random-fill";
import { PreferenceSliderInput } from "@/components/simulation/preference-slider-input";
import type { Electorate, CandidateVoteInput, SimulationResult, Candidate } from "@/types";

interface Props {
  electorate: Electorate;
  candidateCount: number;
}

function FirstPrefTotalBar({
  inputs,
  target,
}: {
  inputs: CandidateVoteInput[];
  target: number;
}) {
  const total = inputs.reduce((sum, inp) => sum + inp.firstPrefVotes, 0);
  const remaining = target - total;
  const isExact = remaining === 0;
  const isOver = remaining < 0;
  const pct = target > 0 ? Math.min(100, (total / target) * 100) : 0;

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700">
          1st Preference Vote Total
        </span>
        <span
          className={`font-mono font-semibold ${
            isExact
              ? "text-green-600"
              : isOver
                ? "text-red-600"
                : "text-amber-600"
          }`}
        >
          {total.toLocaleString()} / {target.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${
            isExact
              ? "bg-green-500"
              : isOver
                ? "bg-red-500"
                : "bg-amber-500"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p
        className={`text-xs ${
          isExact
            ? "text-green-600"
            : isOver
              ? "text-red-600"
              : "text-amber-600"
        }`}
      >
        {isExact
          ? "Total matches registered voters"
          : isOver
            ? `Over by ${Math.abs(remaining).toLocaleString()} votes`
            : `${remaining.toLocaleString()} votes remaining to allocate`}
      </p>
    </div>
  );
}

function SecondPrefTotal({
  distribution,
  excludeId,
}: {
  distribution: Record<number, number>;
  excludeId: number;
}) {
  const total = Object.entries(distribution)
    .filter(([id]) => Number(id) !== excludeId)
    .reduce((sum, [, pct]) => sum + pct, 0);
  const isOver = total > 105;
  const isValid = Math.abs(total - 100) <= 5;

  return (
    <div
      className={`text-xs text-right mt-1 ${
        isOver ? "text-red-600 font-medium" : isValid ? "text-green-600" : "text-zinc-400"
      }`}
    >
      Total: {Math.round(total)}%
      {isOver && " (exceeds 100%)"}
      {isValid && !isOver && " \u2713"}
    </div>
  );
}

export function SimulationPage({ electorate, candidateCount }: Props) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [visibleRounds, setVisibleRounds] = useState(0);
  const [openRounds, setOpenRounds] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const initialCandidates: CandidateVoteInput[] = useMemo(
    () =>
      Array.from({ length: candidateCount }, (_, i) => ({
        candidateId: i + 1,
        candidateName: `Candidate ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ""}`,
        firstPrefVotes: 0,
        secondPrefDistribution: {},
        thirdPrefDistribution: {},
      })),
    [candidateCount]
  );

  const [inputs, setInputs] = useState<CandidateVoteInput[]>(initialCandidates);

  function updateInput(id: number, updates: Partial<CandidateVoteInput>) {
    setInputs((prev) =>
      prev.map((inp) => (inp.candidateId === id ? { ...inp, ...updates } : inp))
    );
  }

  function updateSecondPref(fromId: number, toId: number, value: number) {
    setInputs((prev) =>
      prev.map((inp) =>
        inp.candidateId === fromId
          ? {
              ...inp,
              secondPrefDistribution: {
                ...inp.secondPrefDistribution,
                [toId]: value,
              },
            }
          : inp
      )
    );
  }

  function updateThirdPref(fromId: number, toId: number, value: number) {
    setInputs((prev) =>
      prev.map((inp) =>
        inp.candidateId === fromId
          ? {
              ...inp,
              thirdPrefDistribution: {
                ...inp.thirdPrefDistribution,
                [toId]: value,
              },
            }
          : inp
      )
    );
  }

  function runSimulation() {
    const validationErrors = validateVoteInputs(inputs, electorate.totalRegisteredVoters);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
      setResult(null);
      return;
    }

    setErrors([]);

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
  const hasWinner = currentRound?.winnerId !== null;

  function randomFillDistribution() {
    const total = electorate.totalRegisteredVoters;
    const randomVotes = randomSplitTotal(total, candidateCount);

    setInputs((prev) =>
      prev.map((inp, idx) => {
        const otherIds = prev
          .filter((o) => o.candidateId !== inp.candidateId)
          .map((o) => o.candidateId);

        return {
          ...inp,
          firstPrefVotes: randomVotes[idx],
          secondPrefDistribution: randomPercentSplit(otherIds),
          thirdPrefDistribution: randomPercentSplit(otherIds),
        };
      })
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2 text-sm text-zinc-500">
        <Link href={electorate.seatType === "regional" ? "/regional" : "/open"} className="hover:text-zinc-900">
          {electorate.seatType === "regional" ? "Regional Seats" : "Open Seats"}
        </Link>
        {" / "}
        <Link href={`/electorate/${electorate.slug}`} className="hover:text-zinc-900">
          {electorate.name}
        </Link>
        {" / "}
        <span className="text-zinc-900">Simulation</span>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        Vote Simulation &mdash; {electorate.name}
      </h1>
      <p className="text-zinc-600 mb-6">
        {candidateCount} candidates &middot;{" "}
        {electorate.totalRegisteredVoters.toLocaleString()} registered voters
      </p>

      {!result && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Enter Vote Data</CardTitle>
              <Button variant="outline" size="sm" onClick={randomFillDistribution}>
                Random Fill
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-zinc-600">
                Enter the first preference vote count for each candidate. The
                total must equal the registered voters
                ({electorate.totalRegisteredVoters.toLocaleString()}).
              </p>

              <FirstPrefTotalBar
                inputs={inputs}
                target={electorate.totalRegisteredVoters}
              />

              {inputs.map((inp) => (
                <Card key={inp.candidateId} className="border-l-4" style={{ borderLeftColor: CANDIDATE_COLORS[(inp.candidateId - 1) % CANDIDATE_COLORS.length] }}>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-zinc-700 block mb-1">
                          Candidate Name
                        </label>
                        <Input
                          value={inp.candidateName}
                          onChange={(e) =>
                            updateInput(inp.candidateId, { candidateName: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-700 block mb-1">
                          1st Preference Votes
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={inp.firstPrefVotes || ""}
                          onChange={(e) =>
                            updateInput(inp.candidateId, {
                              firstPrefVotes: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {candidateCount > 2 && (
                      <Accordion>
                        <AccordionItem value="prefs">
                          <AccordionTrigger className="text-sm">
                            Preference Distribution
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-3">
                                  2nd Preference Distribution (% of {inp.candidateName}&apos;s {inp.firstPrefVotes.toLocaleString()} ballots)
                                </p>
                                <div className="space-y-2">
                                  {inputs
                                    .filter((o) => o.candidateId !== inp.candidateId)
                                    .map((other) => (
                                      <PreferenceSliderInput
                                        key={other.candidateId}
                                        label={other.candidateName}
                                        percentage={inp.secondPrefDistribution[other.candidateId] ?? 0}
                                        firstPrefVotes={inp.firstPrefVotes}
                                        onChange={(pct) =>
                                          updateSecondPref(inp.candidateId, other.candidateId, pct)
                                        }
                                      />
                                    ))}
                                  <SecondPrefTotal
                                    distribution={inp.secondPrefDistribution}
                                    excludeId={inp.candidateId}
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500 mb-3">
                                  3rd Preference Distribution (% of {inp.candidateName}&apos;s {inp.firstPrefVotes.toLocaleString()} ballots)
                                </p>
                                <div className="space-y-2">
                                  {inputs
                                    .filter((o) => o.candidateId !== inp.candidateId)
                                    .map((other) => (
                                      <PreferenceSliderInput
                                        key={other.candidateId}
                                        label={other.candidateName}
                                        percentage={inp.thirdPrefDistribution[other.candidateId] ?? 0}
                                        firstPrefVotes={inp.firstPrefVotes}
                                        onChange={(pct) =>
                                          updateThirdPref(inp.candidateId, other.candidateId, pct)
                                        }
                                      />
                                    ))}
                                  <SecondPrefTotal
                                    distribution={inp.thirdPrefDistribution}
                                    excludeId={inp.candidateId}
                                  />
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              ))}

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
            </CardContent>
          </Card>
        </div>
      )}

      {result && visibleRounds > 0 && (
        <div className="space-y-6">
          {/* Round-by-Round Results */}
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
                            Majority needed: {round.majorityThreshold.toLocaleString()}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {(() => {
                          const showTransfers = round.roundNumber > 1;
                          const totalLive = Object.values(round.tallies).reduce((a, b) => a + b, 0);
                          const grandTotal = totalLive + round.totalExhausted;
                          const balances = grandTotal === result.totalFormalVotes;

                          return (
                            <>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    {showTransfers && (
                                      <>
                                        <TableHead className="text-right">Prev. Votes</TableHead>
                                        <TableHead className="text-right">+ Transferred</TableHead>
                                      </>
                                    )}
                                    <TableHead className="text-right">Total Votes</TableHead>
                                    <TableHead className="text-right">%</TableHead>
                                    <TableHead className="w-40">Progress</TableHead>
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

                                      return (
                                        <TableRow
                                          key={id}
                                          className={
                                            isEliminated ? "bg-red-50" : isWinner ? "bg-green-50" : ""
                                          }
                                        >
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: candidate?.color }}
                                              />
                                              <span className="font-medium">{candidate?.name}</span>
                                            </div>
                                          </TableCell>
                                          {showTransfers && (() => {
                                            const detail = round.transferDetail?.[id];
                                            const from2nd = detail?.second ?? 0;
                                            const from3rd = detail?.third ?? 0;
                                            return (
                                              <>
                                                <TableCell className="text-right font-mono">
                                                  {prevVotes.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                  {transferred > 0 ? (
                                                    <div>
                                                      <span className="text-green-700 font-semibold">+{transferred.toLocaleString()}</span>
                                                      <div className="text-[10px] leading-tight mt-0.5 text-zinc-500 font-normal">
                                                        {from2nd > 0 && <span className="text-blue-600">{from2nd.toLocaleString()} 2nd pref</span>}
                                                        {from2nd > 0 && from3rd > 0 && <br />}
                                                        {from3rd > 0 && <span className="text-purple-600">{from3rd.toLocaleString()} 3rd pref</span>}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <span className="text-zinc-400">0</span>
                                                  )}
                                                </TableCell>
                                              </>
                                            );
                                          })()}
                                          <TableCell className="text-right font-mono font-semibold">
                                            {votes.toLocaleString()}
                                          </TableCell>
                                          <TableCell className="text-right font-mono">
                                            {pct.toFixed(1)}%
                                          </TableCell>
                                          <TableCell>
                                            <div className="w-full bg-zinc-100 rounded-full h-2.5">
                                              <div
                                                className="h-2.5 rounded-full transition-all"
                                                style={{
                                                  width: `${barPct}%`,
                                                  backgroundColor: candidate?.color,
                                                }}
                                              />
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {isWinner && (
                                              <Badge className="bg-png-gold text-black">Winner</Badge>
                                            )}
                                            {isEliminated && (
                                              <Badge variant="destructive">Eliminated</Badge>
                                            )}
                                            {!isWinner && !isEliminated && (
                                              <Badge variant="outline">Active</Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  {/* Exhausted votes row */}
                                  <TableRow className="bg-zinc-50">
                                    <TableCell>
                                      <span className="text-zinc-500 font-medium">Exhausted Ballots</span>
                                    </TableCell>
                                    {showTransfers && (
                                      <>
                                        <TableCell className="text-right font-mono text-zinc-500">
                                          {(round.totalExhausted - round.exhausted).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                          {round.exhausted > 0 ? (
                                            <span className="text-amber-600">+{round.exhausted.toLocaleString()}</span>
                                          ) : (
                                            <span className="text-zinc-400">0</span>
                                          )}
                                        </TableCell>
                                      </>
                                    )}
                                    <TableCell className="text-right font-mono text-zinc-500 font-semibold">
                                      {round.totalExhausted.toLocaleString()}
                                    </TableCell>
                                    <TableCell />
                                    <TableCell />
                                    <TableCell />
                                  </TableRow>
                                  {/* Verification total row */}
                                  <TableRow className="border-t-2 font-semibold">
                                    <TableCell>Total</TableCell>
                                    {showTransfers && (
                                      <>
                                        <TableCell />
                                        <TableCell />
                                      </>
                                    )}
                                    <TableCell className="text-right font-mono">
                                      {grandTotal.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {balances
                                        ? <span className="text-green-600">= {result.totalFormalVotes.toLocaleString()} &#10003;</span>
                                        : <span className="text-red-600">&#8800; {result.totalFormalVotes.toLocaleString()}</span>}
                                    </TableCell>
                                    <TableCell colSpan={2}>
                                      <span className="text-xs font-normal text-zinc-500">
                                        Active + exhausted = registered voters
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                              {round.eliminatedCandidateId !== null && (() => {
                                const elimName = result.candidates.find((c) => c.id === round.eliminatedCandidateId)?.name;
                                // Find previously eliminated candidates (for 3rd pref source)
                                const prevEliminated = result.rounds
                                  .filter((r) => r.roundNumber < round.roundNumber && r.eliminatedCandidateId !== null)
                                  .map((r) => result.candidates.find((c) => c.id === r.eliminatedCandidateId)?.name)
                                  .filter(Boolean);

                                // Build per-candidate transfer breakdown
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
                                      <span className="font-medium">{elimName}</span>
                                      {" "}eliminated with {round.tallies[round.eliminatedCandidateId!]?.toLocaleString()} votes.
                                    </p>
                                    <p>
                                      <span className="text-green-700 font-medium">{round.redistributed.toLocaleString()}</span> votes
                                      redistributed to active candidates.
                                      {round.exhausted > 0 && (
                                        <>
                                          {" "}<span className="text-amber-700 font-medium">{round.exhausted.toLocaleString()}</span> ballots
                                          exhausted.
                                        </>
                                      )}
                                    </p>
                                    {transferRows.length > 0 && (
                                      <div className="mt-2 border-t pt-2 space-y-1.5">
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
                                                    : elimName
                                                  }
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
                            </>
                          );
                        })()}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Next Count button — shown when more rounds remain */}
          {!allRoundsVisible && (
            <Button
              className="w-full bg-png-red hover:bg-png-red/90 text-white text-lg py-6"
              onClick={showNextRound}
            >
              {currentRound?.eliminatedCandidateId !== null
                ? `Next Count (Round ${visibleRounds + 1} — redistribute ${result.candidates.find((c) => c.id === currentRound?.eliminatedCandidateId)?.name}'s votes)`
                : `Next Count (Round ${visibleRounds + 1})`}
            </Button>
          )}

          {/* Winner Banner — shown only after all rounds revealed */}
          {allRoundsVisible && (
            <Card className="border-2 border-png-gold bg-gradient-to-r from-png-gold/10 to-transparent">
              <CardContent className="py-8 text-center">
                <p className="text-sm font-medium text-zinc-500 mb-1">Winner</p>
                <h2 className="text-3xl font-bold text-zinc-900">
                  {result.candidates.find((c) => c.id === result.winnerId)?.name}
                </h2>
                <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {result.winnerVotes.toLocaleString()} votes
                  </Badge>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {result.winnerPercentage.toFixed(1)}%
                  </Badge>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    Won in Round {result.rounds.length}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  Total formal votes: {result.totalFormalVotes.toLocaleString()} &middot;
                  Exhausted: {result.rounds[result.rounds.length - 1].totalExhausted.toLocaleString()}
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
