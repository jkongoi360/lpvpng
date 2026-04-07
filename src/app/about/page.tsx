import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
        How Limited Preferential Voting Works
      </h1>
      <p className="text-zinc-600 mb-8">
        Papua New Guinea uses the Limited Preferential Voting (LPV) system for
        national elections. Under LPV, each voter marks three preferences on
        their ballot. This ensures the winner has broad community support, not
        just a narrow lead.
      </p>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>1. How You Vote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-700">
            <p>
              On the ballot paper, a voter writes the number{" "}
              <strong>1</strong> next to their first choice (most preferred
              candidate), <strong>2</strong> next to their second choice, and{" "}
              <strong>3</strong> next to their third choice.
            </p>
            <p>
              To be a <strong>formal (valid) ballot</strong>, all three
              preferences must be filled in. A ballot missing any preference is
              considered informal and will not be counted.
            </p>
            <p>
              The three preferences are limited &mdash; unlike full preferential
              systems used in some countries, PNG voters only rank three
              candidates, regardless of how many are contesting.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. The Counting Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-zinc-700">
            <div>
              <h3 className="font-semibold text-zinc-900 mb-1">
                Step 1: Primary Count (1st Preferences)
              </h3>
              <p>
                All formal ballots are sorted by their <strong>1st preference</strong> vote.
                Each candidate receives a pile of ballots where voters marked them as
                number 1. The total of all 1st preference votes across all candidates
                equals the total number of formal ballots cast.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-1">
                Step 2: Check for Absolute Majority
              </h3>
              <p>
                The majority threshold is calculated: <strong>50% + 1</strong> of
                the total formal votes. If any candidate&apos;s 1st preference
                count meets or exceeds this threshold, they are declared the
                winner immediately. No further counting is needed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-1">
                Step 3: Elimination of Lowest Candidate
              </h3>
              <p>
                If no candidate has a majority, the candidate with the{" "}
                <strong>fewest votes is eliminated</strong> from the count. Their
                ballots are set aside for redistribution. If two candidates are
                tied for the lowest, the one with the lower candidate number is
                eliminated first.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-1">
                Step 4: Redistribution of 2nd Preferences
              </h3>
              <p>
                Each ballot from the eliminated candidate is examined. The{" "}
                <strong>2nd preference</strong> marked on each ballot is checked.
                If that 2nd preference candidate is still active (not yet
                eliminated), the ballot is transferred to them. Their vote total
                increases by the number of ballots they receive.
              </p>
              <p>
                After redistribution, the new totals for all remaining candidates
                are calculated. The total of all active candidates&apos; votes
                plus any exhausted ballots still equals the total formal votes
                cast.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-1">
                Step 5: Check Majority Again
              </h3>
              <p>
                After redistribution, the majority threshold is recalculated
                based on the remaining live (non-exhausted) votes. If any
                candidate now has enough votes to reach the new majority, they
                win. Otherwise, the process continues.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-1">
                Step 6: Further Eliminations and 3rd Preferences
              </h3>
              <p>
                If still no majority, the next lowest candidate is eliminated.
                Their ballots are redistributed again. For ballots that were{" "}
                <strong>originally cast</strong> for this candidate, the 2nd
                preference is transferred. But for ballots that had{" "}
                <strong>already been transferred</strong> from a previously
                eliminated candidate, the <strong>3rd preference</strong> is now
                checked instead (since the 2nd preference was the candidate just
                eliminated).
              </p>
              <p>
                This means in later rounds, active candidates may receive votes
                from two sources:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <span className="text-blue-700 font-medium">2nd preference votes</span>{" "}
                  &mdash; from voters who listed the just-eliminated candidate as
                  their 1st choice
                </li>
                <li>
                  <span className="text-purple-700 font-medium">3rd preference votes</span>{" "}
                  &mdash; from voters whose 1st choice was eliminated in a
                  previous round, and whose 2nd choice is the candidate being
                  eliminated now, so the ballot flows to their 3rd choice
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-1">
                Step 7: Repeat Until Winner
              </h3>
              <p>
                This cycle of eliminating the lowest, redistributing preferences,
                and checking for a majority continues until one candidate reaches
                the threshold. If only two candidates remain, the one with more
                votes wins.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-1">
                Exhausted Votes
              </h3>
              <p className="text-amber-800">
                A ballot becomes <strong>exhausted</strong> when all three of the
                voter&apos;s preferences have been eliminated. Since there are
                only three preferences in LPV, a ballot can exhaust after as few
                as two eliminations. Exhausted ballots are removed from the live
                count, which <strong>lowers the majority threshold</strong>. This
                means a candidate can win with fewer total votes than the
                original 50% + 1.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-1">
                Vote Accounting
              </h3>
              <p className="text-blue-800">
                At every stage of the count, the following must balance:{" "}
                <strong>
                  Active candidate votes + Exhausted ballots = Total formal votes
                </strong>
                . No votes are created or lost during redistribution &mdash; they
                are only transferred between candidates or marked as exhausted.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Example Scenario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-zinc-700">
            <p>
              Imagine an election with <strong>1,000 total formal votes</strong>{" "}
              and four candidates: A, B, C, and D.
            </p>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Round 1: Primary Count
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">1st Pref Votes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">A</TableCell>
                    <TableCell className="text-right">400</TableCell>
                    <TableCell>Active (no majority &mdash; needed 501)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">B</TableCell>
                    <TableCell className="text-right">300</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">C</TableCell>
                    <TableCell className="text-right">200</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                  <TableRow className="bg-red-50">
                    <TableCell className="font-medium">D</TableCell>
                    <TableCell className="text-right">100</TableCell>
                    <TableCell className="text-red-700 font-medium">
                      Eliminated (lowest)
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">1,000</TableCell>
                    <TableCell className="text-green-700">= 1,000 formal votes</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="mt-2 text-sm">
                No candidate has 501 votes. D is eliminated. D&apos;s 100
                ballots are examined for their 2nd preferences.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Round 2: Redistribution of D&apos;s Votes
              </h3>
              <p className="mb-2">
                Of D&apos;s 100 ballots: 40 listed B as 2nd preference, 50 listed
                C as 2nd preference, and 10 listed A as 2nd preference.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Prev. Votes</TableHead>
                    <TableHead className="text-right">+ Transferred</TableHead>
                    <TableHead className="text-right">New Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">A</TableCell>
                    <TableCell className="text-right">400</TableCell>
                    <TableCell className="text-right text-blue-700">+10 (2nd pref from D)</TableCell>
                    <TableCell className="text-right font-semibold">410</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">B</TableCell>
                    <TableCell className="text-right">300</TableCell>
                    <TableCell className="text-right text-blue-700">+40 (2nd pref from D)</TableCell>
                    <TableCell className="text-right font-semibold">340</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                  <TableRow className="bg-red-50">
                    <TableCell className="font-medium">C</TableCell>
                    <TableCell className="text-right">200</TableCell>
                    <TableCell className="text-right text-blue-700">+50 (2nd pref from D)</TableCell>
                    <TableCell className="text-right font-semibold">250</TableCell>
                    <TableCell className="text-red-700 font-medium">
                      Eliminated (lowest)
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-zinc-50">
                    <TableCell className="text-zinc-500">Exhausted</TableCell>
                    <TableCell className="text-right text-zinc-500">0</TableCell>
                    <TableCell className="text-right text-zinc-400">0</TableCell>
                    <TableCell className="text-right text-zinc-500">0</TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right">1,000</TableCell>
                    <TableCell className="text-green-700">= 1,000 formal votes</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="mt-2 text-sm">
                Still no majority (need 501). C is eliminated. C&apos;s 250
                ballots must be redistributed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Round 3: Redistribution of C&apos;s Votes (2nd and 3rd Preferences)
              </h3>
              <p className="mb-2">
                C has 250 ballots. Some are original (voters who picked C as 1st
                choice), and 50 came from D in the previous round.
              </p>
              <ul className="list-disc ml-6 space-y-1 mb-3 text-sm">
                <li>
                  <strong>C&apos;s original 200 ballots:</strong> Their 2nd
                  preference is checked. Say 120 listed A and 70 listed B, and 10
                  listed D (already eliminated, so those exhaust).
                </li>
                <li>
                  <strong>50 ballots transferred from D:</strong> These ballots
                  had D as 1st choice and C as 2nd choice. Now C is eliminated
                  too, so the <strong>3rd preference</strong> is checked. Say 30
                  listed A and 15 listed B, and 5 had no valid 3rd preference
                  (exhaust).
                </li>
              </ul>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Prev. Votes</TableHead>
                    <TableHead className="text-right">+ Transferred</TableHead>
                    <TableHead className="text-right">New Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-green-50">
                    <TableCell className="font-medium">A</TableCell>
                    <TableCell className="text-right">410</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span className="text-green-700 font-semibold">+150</span>
                        <div className="text-[11px] leading-tight mt-0.5">
                          <span className="text-blue-600">120 as 2nd pref from C</span>
                          <br />
                          <span className="text-purple-600">30 as 3rd pref from D voters via C</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">560</TableCell>
                    <TableCell className="text-green-700 font-bold">
                      Winner (needed 493)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">B</TableCell>
                    <TableCell className="text-right">340</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span className="text-green-700 font-semibold">+85</span>
                        <div className="text-[11px] leading-tight mt-0.5">
                          <span className="text-blue-600">70 as 2nd pref from C</span>
                          <br />
                          <span className="text-purple-600">15 as 3rd pref from D voters via C</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">425</TableCell>
                    <TableCell>Runner-up</TableCell>
                  </TableRow>
                  <TableRow className="bg-zinc-50">
                    <TableCell className="text-zinc-500">Exhausted</TableCell>
                    <TableCell className="text-right text-zinc-500">0</TableCell>
                    <TableCell className="text-right text-amber-600">+15</TableCell>
                    <TableCell className="text-right text-zinc-500">15</TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      10 had D as 2nd (eliminated), 5 had no valid 3rd
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right">1,000</TableCell>
                    <TableCell className="text-green-700">= 1,000 formal votes</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="mt-2 text-sm">
                A reaches 560 votes, exceeding the new majority threshold of 493
                (50% + 1 of 985 live votes). <strong>Candidate A wins.</strong>
              </p>
            </div>

            <div className="bg-zinc-100 border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-zinc-900">Key Takeaways</h3>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>
                  1st preference votes determine the initial standing, but 2nd
                  and 3rd preferences decide the winner when no one has a
                  majority.
                </li>
                <li>
                  <span className="text-blue-700 font-medium">2nd preference</span> votes
                  transfer directly from the just-eliminated candidate to active
                  candidates.
                </li>
                <li>
                  <span className="text-purple-700 font-medium">3rd preference</span> votes
                  come into play when a ballot&apos;s 1st choice was eliminated
                  in a previous round and their 2nd choice is now also
                  eliminated &mdash; the ballot flows to the 3rd choice.
                </li>
                <li>
                  At every stage:{" "}
                  <strong>active votes + exhausted = total formal votes</strong>.
                  No votes are created or lost.
                </li>
                <li>
                  Exhausted ballots lower the majority threshold, so a winner can
                  emerge with fewer votes than the original 50% + 1.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
