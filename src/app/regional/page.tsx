import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRegionalSeatsByRegion, getProvinceById } from "@/lib/data-loader";

const regionOrder = ["Highlands", "Momase", "Southern", "Islands", "NCD"] as const;

export default function RegionalPage() {
  const seatsByRegion = getRegionalSeatsByRegion();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Regional Seats
        </h1>
        <p className="mt-2 text-zinc-600">
          22 Regional electorates &mdash; one per province. Click on any seat to
          view details and run a simulation.
        </p>
      </div>

      <div className="space-y-10">
        {regionOrder.map((region) => {
          const seats = seatsByRegion[region];
          if (!seats || seats.length === 0) return null;

          return (
            <div key={region}>
              <h2 className="text-xl font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {region}
                </Badge>
                <span>{seats.length} seat{seats.length !== 1 ? "s" : ""}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {seats.map((seat) => {
                  const province = getProvinceById(seat.provinceId);
                  return (
                    <Link key={seat.slug} href={`/electorate/${seat.slug}`} className="group">
                      <Card className="transition-all hover:shadow-md hover:border-png-red/40 group-hover:-translate-y-0.5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{seat.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-zinc-500">
                            {province?.name}
                          </p>
                          <p className="text-sm font-medium text-zinc-700 mt-1">
                            {seat.totalRegisteredVoters.toLocaleString()} registered voters
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
