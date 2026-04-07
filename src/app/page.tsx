import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          PNG Election Simulator
        </h1>
        <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
          Explore Papua New Guinea&apos;s Limited Preferential Voting (LPV) system
          and simulate election outcomes for the 2027 General Elections.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-1 w-12 bg-png-red" />
          <div className="h-1 w-12 bg-png-black" />
          <div className="h-1 w-12 bg-png-gold" />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <Link href="/regional" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-png-red/50 group-hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-2xl">Regional Seats</CardTitle>
              <CardDescription className="text-base">
                22 Provincial/Regional electorates &mdash; one per province
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600">
                Each province in PNG elects one Regional Member of Parliament.
                Regional seats cover the entire province, representing all open
                electorates within it.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-png-red">
                View Regional Seats
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/open" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-png-gold/50 group-hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-2xl">Open Seats</CardTitle>
              <CardDescription className="text-base">
                89 Open electorates across all provinces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600">
                Open electorates are subdivisions within each province. Each
                elects one Open Member of Parliament. Select an electorate to
                view its LLGs, wards, and run a vote simulation.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-png-gold">
                Browse Open Seats
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Learn how Limited Preferential Voting works &rarr;
        </Link>
      </div>
    </div>
  );
}
