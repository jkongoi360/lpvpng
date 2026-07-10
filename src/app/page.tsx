import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Public onboarding / landing page. Explains SmartVoter PNG and routes new
// visitors to register or sign in. The actual data (electorates, simulations,
// maps) lives behind auth — see src/proxy.ts.
export const metadata = {
  title: "SmartVoter PNG — Limited Preferential Voting Simulator 2027",
  description:
    "Explore Papua New Guinea's Limited Preferential Voting system and simulate the 2027 General Elections, ward by ward.",
};

const features = [
  {
    title: "Ward-by-ward simulation",
    body: "Run Limited Preferential Voting simulations down to the ward level across every Open electorate, with realistic preference transfers and elimination rounds.",
  },
  {
    title: "Interactive district maps",
    body: "Explore registered-voter distribution on satellite maps with real district boundaries for 97 electorates — pins for every ward, grouped by LLG.",
  },
  {
    title: "Full national coverage",
    body: "All 91 Open electorates and 22 Regional seats across PNG's 22 provinces, backed by ward-level registered-voter data.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-png-black text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="mb-6 flex items-center justify-center gap-1.5">
            <div className="h-2 w-16 bg-png-red rounded-sm" />
            <div className="h-2 w-16 bg-white rounded-sm" />
            <div className="h-2 w-16 bg-png-gold rounded-sm" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            SmartVoter PNG
          </h1>
          <p className="mt-3 text-lg font-medium text-png-gold">
            Limited Preferential Voting Simulator · 2027 General Elections
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
            An interactive tool for exploring Papua New Guinea&apos;s Limited
            Preferential Voting (LPV) system. Model election outcomes ward by
            ward, across all Open electorates and every Regional seat.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto rounded-lg bg-png-red px-8 py-3 text-base font-semibold text-white hover:bg-png-red/90 transition-colors"
            >
              Create a free account
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-lg border border-white/25 px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            A free account is required to access the simulator and electorate
            data.
          </p>
        </div>
      </section>

      {/* What you can do */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            What you can do
          </h2>
          <p className="mt-3 text-zinc-600">
            Everything you need to understand and model PNG&apos;s LPV elections.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="h-full">
              <CardHeader>
                <CardTitle className="text-xl">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 leading-relaxed">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How LPV works teaser */}
      <section className="border-t bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                New to Limited Preferential Voting?
              </CardTitle>
              <CardDescription className="text-base">
                Under LPV, voters rank up to three candidates. If no one wins a
                majority, the lowest candidate is eliminated and their votes
                transfer by preference — repeating until a candidate passes 50%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-medium text-png-red hover:gap-3 transition-all"
              >
                Learn how LPV works &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Ready to explore the 2027 simulator?
        </h2>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-png-red px-8 py-3 text-base font-semibold text-white hover:bg-png-red/90 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-8 py-3 text-base font-semibold text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
