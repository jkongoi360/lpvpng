import type {
  Ballot,
  Candidate,
  CandidateVoteInput,
  EliminationRound,
  SimulationResult,
  TransferDetail,
} from "@/types";

/**
 * Generate individual ballots from aggregate user input.
 * Each CandidateVoteInput specifies first-preference vote counts
 * and distributions for 2nd/3rd preferences as percentages.
 */
export function generateBallots(inputs: CandidateVoteInput[]): Ballot[] {
  const ballots: Ballot[] = [];

  for (const input of inputs) {
    const { candidateId, firstPrefVotes, secondPrefDistribution, thirdPrefDistribution } = input;

    // Get sorted list of other candidates with their 2nd-pref share
    const secondPrefEntries = Object.entries(secondPrefDistribution)
      .map(([id, pct]) => ({ id: Number(id), pct }))
      .filter((e) => e.pct > 0);

    const thirdPrefEntries = Object.entries(thirdPrefDistribution)
      .map(([id, pct]) => ({ id: Number(id), pct }))
      .filter((e) => e.pct > 0);

    // For each first-preference vote, assign 2nd and 3rd prefs
    // based on distributions
    for (let i = 0; i < firstPrefVotes; i++) {
      const prefs: number[] = [candidateId];

      // Assign 2nd preference based on distribution
      const secondPref = pickFromDistribution(secondPrefEntries, i, firstPrefVotes);
      if (secondPref !== null) {
        prefs.push(secondPref);
      }

      // Assign 3rd preference based on distribution
      // (excluding the already-picked 2nd preference candidate)
      const thirdFiltered = thirdPrefEntries.filter((e) => e.id !== secondPref);
      const thirdPref = pickFromDistribution(thirdFiltered, i, firstPrefVotes);
      if (thirdPref !== null) {
        prefs.push(thirdPref);
      }

      ballots.push({ preferences: prefs });
    }
  }

  return ballots;
}

/**
 * Deterministic distribution: use the ballot index to pick from
 * the distribution proportionally.
 */
function pickFromDistribution(
  entries: { id: number; pct: number }[],
  index: number,
  total: number
): number | null {
  if (entries.length === 0) return null;

  const totalPct = entries.reduce((sum, e) => sum + e.pct, 0);
  if (totalPct === 0) return null;

  // Normalize and pick based on position
  const position = (index / total) * totalPct;
  let cumulative = 0;
  for (const entry of entries) {
    cumulative += entry.pct;
    if (position < cumulative) return entry.id;
  }

  return entries[entries.length - 1].id;
}

/**
 * Run the LPV counting algorithm.
 * Returns round-by-round results and the final winner.
 */
export function runLPVCount(
  candidates: Candidate[],
  ballots: Ballot[]
): SimulationResult {
  const activeCandidates = new Set(candidates.map((c) => c.id));
  const eliminatedSet = new Set<number>();
  const rounds: EliminationRound[] = [];
  let prevTallies: Record<number, number> = {};
  let prevExhausted = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const roundNumber = rounds.length + 1;

    // 1. Tally: for each ballot, find highest-ranked active candidate
    const tallies: Record<number, number> = {};
    for (const id of activeCandidates) tallies[id] = 0;
    let currentExhausted = 0;

    for (const ballot of ballots) {
      const activeChoice = ballot.preferences.find((id) => activeCandidates.has(id));
      if (activeChoice !== undefined) {
        tallies[activeChoice]++;
      } else {
        currentExhausted++;
      }
    }

    // Compute transfers and their preference breakdown
    const transfersReceived: Record<number, number> = {};
    const transferDetail: Record<number, TransferDetail> = {};
    for (const id of activeCandidates) {
      const prev = prevTallies[id] ?? 0;
      const curr = tallies[id];
      transfersReceived[id] = curr - prev;
      transferDetail[id] = { second: 0, third: 0 };
    }

    // For rounds after the first, examine each ballot that transferred
    // to determine if it came via 2nd or 3rd preference
    if (roundNumber > 1) {
      for (const ballot of ballots) {
        const activeChoice = ballot.preferences.find((id) => activeCandidates.has(id));
        if (activeChoice === undefined) continue;

        // What preference position is this ballot using?
        const prefIndex = ballot.preferences.indexOf(activeChoice);
        if (prefIndex === 0) continue; // still on 1st pref — not a transfer

        // Was this ballot's previous choice the most recently eliminated candidate?
        // Walk preferences before the current one; the first eliminated one we find
        // that was eliminated LAST round is the source of this transfer.
        const lastEliminated = rounds.length > 0
          ? rounds[rounds.length - 1].eliminatedCandidateId
          : null;

        // Check if this ballot was previously counted toward the last eliminated candidate
        let wasOnLastEliminated = false;
        for (let pi = 0; pi < prefIndex; pi++) {
          if (ballot.preferences[pi] === lastEliminated) {
            wasOnLastEliminated = true;
            break;
          }
          // If a preference before current is still active, ballot didn't transfer
          if (activeCandidates.has(ballot.preferences[pi])) break;
        }

        if (wasOnLastEliminated) {
          if (prefIndex === 1) {
            transferDetail[activeChoice].second++;
          } else if (prefIndex === 2) {
            transferDetail[activeChoice].third++;
          }
        }
      }
    }

    // Previous tallies for display (carried forward from last round)
    const previousTallies: Record<number, number> = {};
    for (const id of activeCandidates) {
      previousTallies[id] = prevTallies[id] ?? tallies[id]; // round 1: same as tallies
    }

    const exhaustedThisRound = currentExhausted - prevExhausted;

    // 2. Calculate majority threshold (50% + 1 of live ballots)
    const liveVotes = Object.values(tallies).reduce((a, b) => a + b, 0);
    const majorityThreshold = Math.floor(liveVotes / 2) + 1;

    // 3. Find leader and lowest
    let maxId = -1;
    let maxVotes = 0;
    let minId = -1;
    let minVotes = Infinity;

    for (const [idStr, votes] of Object.entries(tallies)) {
      const id = Number(idStr);
      if (votes > maxVotes) {
        maxVotes = votes;
        maxId = id;
      }
      if (votes < minVotes || (votes === minVotes && id < minId)) {
        minVotes = votes;
        minId = id;
      }
    }

    if (maxVotes >= majorityThreshold || activeCandidates.size <= 2) {
      // Winner found
      rounds.push({
        roundNumber,
        tallies: { ...tallies },
        previousTallies: { ...previousTallies },
        transfersReceived: { ...transfersReceived },
        transferDetail: { ...transferDetail },
        eliminatedCandidateId: null,
        redistributed: 0,
        exhausted: exhaustedThisRound,
        totalExhausted: currentExhausted,
        winnerId: maxId,
        majorityThreshold,
      });

      return {
        candidates,
        totalFormalVotes: ballots.length,
        rounds,
        winnerId: maxId,
        winnerVotes: maxVotes,
        winnerPercentage: liveVotes > 0 ? (maxVotes / liveVotes) * 100 : 0,
      };
    }

    // 4. Count how many of the eliminated candidate's ballots transfer to each active candidate
    const transferTo: Record<number, number> = {};
    for (const id of activeCandidates) {
      if (id !== minId) transferTo[id] = 0;
    }
    let willExhaust = 0;

    for (const ballot of ballots) {
      const currentChoice = ballot.preferences.find((id) => activeCandidates.has(id));
      if (currentChoice === minId) {
        const nextChoice = ballot.preferences.find(
          (id) => id !== minId && activeCandidates.has(id)
        );
        if (nextChoice !== undefined) {
          transferTo[nextChoice]++;
        } else {
          willExhaust++;
        }
      }
    }
    const willTransfer = Object.values(transferTo).reduce((a, b) => a + b, 0);

    // 5. Record this round
    rounds.push({
      roundNumber,
      tallies: { ...tallies },
      previousTallies: { ...previousTallies },
      transfersReceived: { ...transfersReceived },
      transferDetail: { ...transferDetail },
      eliminatedCandidateId: minId,
      redistributed: willTransfer,
      exhausted: exhaustedThisRound + willExhaust,
      totalExhausted: currentExhausted + willExhaust,
      winnerId: null,
      majorityThreshold,
    });

    // 6. Eliminate and prepare for next round
    // Store current tallies (without eliminated) as the basis for next round's "previous"
    const carryForward: Record<number, number> = {};
    for (const [idStr, votes] of Object.entries(tallies)) {
      const id = Number(idStr);
      if (id !== minId) {
        carryForward[id] = votes;
      }
    }
    prevTallies = carryForward;
    activeCandidates.delete(minId);
    eliminatedSet.add(minId);
    prevExhausted = currentExhausted + willExhaust;

    // Safety: if only one candidate left, do one final tally
    if (activeCandidates.size === 1) {
      const winnerId = [...activeCandidates][0];
      const finalTallies: Record<number, number> = {};
      finalTallies[winnerId] = 0;
      let finalExhausted = 0;

      for (const ballot of ballots) {
        const activeChoice = ballot.preferences.find((id) => activeCandidates.has(id));
        if (activeChoice !== undefined) {
          finalTallies[activeChoice]++;
        } else {
          finalExhausted++;
        }
      }

      const finalTransfers: Record<number, number> = {};
      finalTransfers[winnerId] = finalTallies[winnerId] - (prevTallies[winnerId] ?? 0);

      const finalPrev: Record<number, number> = {};
      finalPrev[winnerId] = prevTallies[winnerId] ?? 0;

      // Compute transfer detail for final round
      const finalDetail: Record<number, TransferDetail> = {};
      finalDetail[winnerId] = { second: 0, third: 0 };
      const lastElim = rounds[rounds.length - 1].eliminatedCandidateId;
      for (const ballot of ballots) {
        const activeChoice = ballot.preferences.find((id) => activeCandidates.has(id));
        if (activeChoice !== winnerId) continue;
        const prefIndex = ballot.preferences.indexOf(winnerId);
        if (prefIndex === 0) continue;
        // Check ballot was previously on the last eliminated candidate
        let wasOnLast = false;
        for (let pi = 0; pi < prefIndex; pi++) {
          if (ballot.preferences[pi] === lastElim) { wasOnLast = true; break; }
          if (activeCandidates.has(ballot.preferences[pi])) break;
        }
        if (wasOnLast) {
          if (prefIndex === 1) finalDetail[winnerId].second++;
          else if (prefIndex === 2) finalDetail[winnerId].third++;
        }
      }

      const finalLive = finalTallies[winnerId];
      rounds.push({
        roundNumber: rounds.length + 1,
        tallies: finalTallies,
        previousTallies: finalPrev,
        transfersReceived: finalTransfers,
        transferDetail: finalDetail,
        eliminatedCandidateId: null,
        redistributed: 0,
        exhausted: finalExhausted - prevExhausted,
        totalExhausted: finalExhausted,
        winnerId,
        majorityThreshold: Math.floor(finalLive / 2) + 1,
      });

      return {
        candidates,
        totalFormalVotes: ballots.length,
        rounds,
        winnerId,
        winnerVotes: finalLive,
        winnerPercentage: finalLive > 0 ? 100 : 0,
      };
    }
  }
}

export const CANDIDATE_COLORS = [
  "#CE1126", // PNG Red
  "#1E40AF", // Blue
  "#15803D", // Green
  "#FCD116", // PNG Gold
  "#9333EA", // Purple
  "#EA580C", // Orange
  "#0891B2", // Cyan
  "#BE185D", // Pink
  "#4338CA", // Indigo
  "#65A30D", // Lime
  "#DC2626", // Red
  "#0D9488", // Teal
  "#7C3AED", // Violet
  "#D97706", // Amber
  "#059669", // Emerald
];
