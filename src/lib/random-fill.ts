/**
 * Split a total into `count` random integers that sum exactly to `total`.
 * Produces a realistic distribution — not uniform, with some candidates
 * getting more votes than others.
 */
export function randomSplitTotal(total: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [total];

  // Generate random weights using exponential-ish distribution
  // so some candidates get noticeably more than others
  const weights = Array.from({ length: count }, () => Math.random() * Math.random() + 0.05);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  // Convert weights to vote counts
  const votes = weights.map((w) => Math.floor((w / weightSum) * total));

  // Distribute the remainder to match total exactly
  let remainder = total - votes.reduce((a, b) => a + b, 0);
  let i = 0;
  while (remainder > 0) {
    votes[i % count]++;
    remainder--;
    i++;
  }

  return votes;
}

/**
 * Generate a random percentage distribution across candidate IDs that sums to 100.
 * Each candidate gets a random share (integers, minimum 1% if possible).
 */
export function randomPercentSplit(candidateIds: number[]): Record<number, number> {
  if (candidateIds.length === 0) return {};
  if (candidateIds.length === 1) return { [candidateIds[0]]: 100 };

  // Generate random weights
  const weights = candidateIds.map(() => Math.random() + 0.1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  // Convert to integer percentages
  const pcts = weights.map((w) => Math.max(1, Math.floor((w / weightSum) * 100)));

  // Adjust to sum to exactly 100
  let pctSum = pcts.reduce((a, b) => a + b, 0);
  let idx = 0;
  while (pctSum < 100) {
    pcts[idx % pcts.length]++;
    pctSum++;
    idx++;
  }
  while (pctSum > 100) {
    // Find the largest to subtract from
    const maxIdx = pcts.indexOf(Math.max(...pcts));
    if (pcts[maxIdx] > 1) {
      pcts[maxIdx]--;
      pctSum--;
    } else {
      break;
    }
  }

  const result: Record<number, number> = {};
  candidateIds.forEach((id, i) => {
    result[id] = pcts[i];
  });
  return result;
}
