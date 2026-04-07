"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Electorate, Province, ElectorateLLGData } from "@/types";

interface Props {
  electorate: Electorate;
  province: Province | null;
  llgData: ElectorateLLGData | null;
}

export function ElectorateDetail({ electorate, province, llgData }: Props) {
  const router = useRouter();
  const [candidateCount, setCandidateCount] = useState(4);

  const totalLLGs = llgData?.llgs.length ?? 0;
  const totalWards = llgData?.llgs.reduce((sum, llg) => sum + llg.wards.length, 0) ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2 text-sm text-zinc-500">
        <Link href={electorate.seatType === "regional" ? "/regional" : "/open"} className="hover:text-zinc-900">
          {electorate.seatType === "regional" ? "Regional Seats" : "Open Seats"}
        </Link>
        {" / "}
        <span className="text-zinc-900">{electorate.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{electorate.name}</CardTitle>
                <Badge variant={electorate.seatType === "regional" ? "default" : "secondary"}>
                  {electorate.seatType === "regional" ? "Regional" : "Open"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Province</p>
                  <p className="font-medium">{province?.name ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Region</p>
                  <p className="font-medium">{province?.region ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Total LLGs</p>
                  <p className="font-medium">{totalLLGs}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Total Wards</p>
                  <p className="font-medium">{totalWards}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
                <p className="text-sm text-zinc-500">Registered Voters</p>
                <p className="text-3xl font-bold text-zinc-900">
                  {electorate.totalRegisteredVoters.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {llgData && llgData.llgs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Local Level Governments &amp; Wards</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion multiple>
                  {llgData.llgs.map((llg) => {
                    const llgVoters = llg.wards.reduce(
                      (sum, w) => sum + w.registeredVoters,
                      0
                    );
                    return (
                      <AccordionItem key={llg.id} value={llg.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-4 flex-1 mr-4">
                            <span className="font-medium">{llg.name}</span>
                            <span className="text-sm text-zinc-500">
                              {llg.wards.length} wards
                            </span>
                            <span className="text-sm font-medium text-zinc-700 ml-auto">
                              {llgVoters.toLocaleString()} voters
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ward</TableHead>
                                <TableHead className="text-right">
                                  Registered Voters
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {llg.wards.map((ward) => (
                                <TableRow key={ward.id}>
                                  <TableCell>{ward.name}</TableCell>
                                  <TableCell className="text-right">
                                    {ward.registeredVoters.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-png-red/30">
            <CardHeader>
              <CardTitle>Run Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="candidate-count"
                  className="text-sm font-medium text-zinc-700 block mb-1"
                >
                  Number of Candidates
                </label>
                <Input
                  id="candidate-count"
                  type="number"
                  min={2}
                  max={50}
                  value={candidateCount}
                  onChange={(e) =>
                    setCandidateCount(Math.max(2, Math.min(50, Number(e.target.value))))
                  }
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Enter the number of candidates contesting this electorate (2-50)
                </p>
              </div>
              <Button
                className="w-full bg-png-red hover:bg-png-red/90 text-white"
                onClick={() =>
                  router.push(
                    `/electorate/${electorate.slug}/simulate?candidates=${candidateCount}`
                  )
                }
              >
                Proceed to Simulation
              </Button>
            </CardContent>
          </Card>

          {electorate.seatType === "open" && llgData && llgData.llgs.length > 0 && (
            <Card className="border-png-gold/30">
              <CardHeader>
                <CardTitle>Ward-by-Ward Simulation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-600">
                  Break down votes by ward. Enter candidate vote counts for each
                  ward across {totalLLGs} LLG{totalLLGs !== 1 ? "s" : ""} and{" "}
                  {totalWards} ward{totalWards !== 1 ? "s" : ""}, then run the
                  LPV count on the aggregated totals.
                </p>
                <div>
                  <label
                    htmlFor="candidate-count-ward"
                    className="text-sm font-medium text-zinc-700 block mb-1"
                  >
                    Number of Candidates
                  </label>
                  <Input
                    id="candidate-count-ward"
                    type="number"
                    min={2}
                    max={50}
                    value={candidateCount}
                    onChange={(e) =>
                      setCandidateCount(Math.max(2, Math.min(50, Number(e.target.value))))
                    }
                  />
                </div>
                <Button
                  className="w-full bg-png-gold hover:bg-png-gold/90 text-black font-semibold"
                  onClick={() =>
                    router.push(
                      `/electorate/${electorate.slug}/simulate-wards?candidates=${candidateCount}`
                    )
                  }
                >
                  Proceed to Ward-by-Ward Simulation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
