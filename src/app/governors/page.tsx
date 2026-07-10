import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRegionalSeatsByRegion, getProvinceById } from "@/lib/data-loader";
import governorsData from "@/data/governors.json";

export const metadata = {
  title: "Governors — SmartVoter PNG",
  description:
    "Papua New Guinea's provincial governors and how they are elected under the Regional seat system.",
};

const regionOrder = ["Highlands", "Momase", "Southern", "Islands", "NCD"] as const;

const GOVERNORS = governorsData.governors as Record<string, string>;

export default function GovernorsPage() {
  const seatsByRegion = getRegionalSeatsByRegion();
  const total = Object.keys(GOVERNORS).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Governors
        </h1>
        <p className="mt-2 text-zinc-600 max-w-3xl">
          Each of Papua New Guinea&apos;s {total} provinces is led by a
          Provincial Governor. Below are the current governors and how the role
          is filled.
        </p>
      </div>

      {/* How governors are elected */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="text-xl">
            How governors are elected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-zinc-700">
          <p>
            Papua New Guinea has no separate ballot for governor. Every province
            elects one <strong>Regional (Provincial) Member</strong> to the
            National Parliament, chosen by all voters across the whole province
            in a single province-wide electorate — using the same{" "}
            <Link href="/about" className="text-png-red underline underline-offset-2">
              Limited Preferential Voting
            </Link>{" "}
            count as every other seat (voters rank up to three candidates; the
            lowest are eliminated and preferences transfer until someone passes
            the majority threshold).
          </p>
          <p>
            The winning Regional Member <strong>automatically becomes the
            Governor</strong> of that province and chairs its provincial
            assembly. The one exception: if the Regional Member is appointed to
            the National Executive Council (i.e. becomes a Minister), the
            governorship passes to one of the province&apos;s Open Members
            instead.
          </p>
          <p>
            Governors serve for the five-year parliamentary term. The next
            general election is scheduled for <strong>2027</strong>.
          </p>
        </CardContent>
      </Card>

      <div className="mb-6 flex items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Current governors
        </h2>
        <Badge variant="outline" className="text-xs">
          {governorsData.asOf}
        </Badge>
      </div>

      <div className="space-y-10">
        {regionOrder.map((region) => {
          const seats = seatsByRegion[region];
          if (!seats || seats.length === 0) return null;
          return (
            <div key={region}>
              <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {region}
                </Badge>
                <span className="text-sm font-normal text-zinc-500">
                  {seats.length} province{seats.length !== 1 ? "s" : ""}
                </span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {seats.map((seat) => {
                  const province = getProvinceById(seat.provinceId);
                  const governor = GOVERNORS[seat.provinceId] ?? "—";
                  return (
                    <Card key={seat.slug} className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-zinc-900">
                          {governor}
                        </CardTitle>
                        <p className="text-sm font-medium text-png-red">
                          Governor of {province?.name}
                        </p>
                      </CardHeader>
                      <CardContent className="text-sm text-zinc-500">
                        <p>
                          <Link
                            href={`/electorate/${seat.slug}`}
                            className="hover:text-png-red underline underline-offset-2"
                          >
                            {seat.name}
                          </Link>
                        </p>
                        <p className="mt-1">
                          {seat.totalRegisteredVoters.toLocaleString()} registered
                          voters
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 border-t border-zinc-100 pt-4 text-xs leading-relaxed text-zinc-400">
        Governors reflect the results of the 2022 general election (11th
        National Parliament) and may change during the term through
        by-elections, court-ordered recounts, votes of no confidence, or
        ministerial appointments. Sources: Wikipedia (Provinces of Papua New
        Guinea) and PNG news reporting.
      </p>
    </div>
  );
}
