"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getElectoratesByProvince } from "@/lib/data-loader";

export default function OpenSeatsPage() {
  const [search, setSearch] = useState("");
  const provincesWithElectorates = getElectoratesByProvince();

  const filtered = provincesWithElectorates
    .map((province) => ({
      ...province,
      electorates: province.electorates.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        province.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((p) => p.electorates.length > 0);

  const totalShown = filtered.reduce((sum, p) => sum + p.electorates.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Open Seats
        </h1>
        <p className="mt-2 text-zinc-600">
          89 Open electorates grouped by province. Search or browse to find an
          electorate and run a simulation.
        </p>
      </div>

      <div className="mb-8 max-w-md">
        <Input
          type="search"
          placeholder="Search electorates or provinces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-base"
        />
        <p className="mt-2 text-sm text-zinc-500">
          Showing {totalShown} electorate{totalShown !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-10">
        {filtered.map((province) => (
          <div key={province.id}>
            <h2 className="text-xl font-semibold text-zinc-800 mb-4 flex items-center gap-2">
              {province.name}
              <Badge variant="outline" className="text-xs">
                {province.region}
              </Badge>
              <span className="text-sm font-normal text-zinc-500">
                {province.electorates.length} electorate{province.electorates.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {province.electorates.map((electorate) => (
                <Link
                  key={electorate.slug}
                  href={`/electorate/${electorate.slug}`}
                  className="group"
                >
                  <Card className="transition-all hover:shadow-md hover:border-png-gold/40 group-hover:-translate-y-0.5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{electorate.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium text-zinc-700">
                        {electorate.totalRegisteredVoters.toLocaleString()} registered voters
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No electorates found matching &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
