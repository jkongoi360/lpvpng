import type { CandidateVoteInput } from "@/types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateVoteInputs(
  inputs: CandidateVoteInput[],
  totalRegisteredVoters: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (inputs.length < 2) {
    errors.push({ field: "candidates", message: "At least 2 candidates are required" });
    return errors;
  }

  const totalFirstPref = inputs.reduce((sum, i) => sum + i.firstPrefVotes, 0);

  if (totalFirstPref !== totalRegisteredVoters) {
    errors.push({
      field: "totalVotes",
      message: `Total first preference votes (${totalFirstPref.toLocaleString()}) must equal registered voters (${totalRegisteredVoters.toLocaleString()}). ${
        totalFirstPref > totalRegisteredVoters
          ? `Over by ${(totalFirstPref - totalRegisteredVoters).toLocaleString()}.`
          : `${(totalRegisteredVoters - totalFirstPref).toLocaleString()} votes still to allocate.`
      }`,
    });
  }

  for (const input of inputs) {
    if (input.firstPrefVotes < 0) {
      errors.push({
        field: `candidate-${input.candidateId}-votes`,
        message: `${input.candidateName}: votes cannot be negative`,
      });
    }

    if (!input.candidateName.trim()) {
      errors.push({
        field: `candidate-${input.candidateId}-name`,
        message: `Candidate ${input.candidateId}: name is required`,
      });
    }

    // Validate 2nd preference distribution sums to ~100% (allow small rounding)
    const secondTotal = Object.values(input.secondPrefDistribution).reduce(
      (s, v) => s + v,
      0
    );
    if (input.firstPrefVotes > 0 && secondTotal > 0 && Math.abs(secondTotal - 100) > 5) {
      errors.push({
        field: `candidate-${input.candidateId}-second`,
        message: `${input.candidateName}: 2nd preference distribution should sum to ~100% (currently ${secondTotal.toFixed(1)}%)`,
      });
    }

    // Validate 3rd preference distribution
    const thirdTotal = Object.values(input.thirdPrefDistribution).reduce(
      (s, v) => s + v,
      0
    );
    if (input.firstPrefVotes > 0 && thirdTotal > 0 && Math.abs(thirdTotal - 100) > 5) {
      errors.push({
        field: `candidate-${input.candidateId}-third`,
        message: `${input.candidateName}: 3rd preference distribution should sum to ~100% (currently ${thirdTotal.toFixed(1)}%)`,
      });
    }
  }

  return errors;
}
