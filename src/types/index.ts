export type Region = "Highlands" | "Momase" | "Southern" | "Islands" | "NCD";

export interface Province {
  id: string;
  name: string;
  region: Region;
  regionalSeatName: string;
}

export interface Electorate {
  slug: string;
  name: string;
  provinceId: string;
  seatType: "open" | "regional";
  totalRegisteredVoters: number;
}

export interface LLG {
  id: string;
  name: string;
  electorateSlug: string;
  wards: Ward[];
}

export interface Ward {
  id: string;
  name: string;
  registeredVoters: number;
}

export interface Candidate {
  id: number;
  name: string;
  color: string;
}

export interface Ballot {
  preferences: number[]; // [1st, 2nd, 3rd] candidate IDs
}

export interface TransferDetail {
  second: number; // votes received as 2nd preference from eliminated candidate
  third: number;  // votes received as 3rd preference (from current or previously eliminated)
}

export interface EliminationRound {
  roundNumber: number;
  tallies: Record<number, number>; // candidateId -> total vote count this round
  previousTallies: Record<number, number>; // candidateId -> votes carried from previous round
  transfersReceived: Record<number, number>; // candidateId -> total votes received
  transferDetail: Record<number, TransferDetail>; // candidateId -> breakdown by preference
  eliminatedCandidateId: number | null;
  redistributed: number;
  exhausted: number;
  totalExhausted: number;
  winnerId: number | null;
  majorityThreshold: number;
}

export interface SimulationResult {
  candidates: Candidate[];
  totalFormalVotes: number;
  rounds: EliminationRound[];
  winnerId: number;
  winnerVotes: number;
  winnerPercentage: number;
}

export interface CandidateVoteInput {
  candidateId: number;
  candidateName: string;
  firstPrefVotes: number;
  // For each other candidate, what % of THIS candidate's ballots
  // list that other candidate as 2nd preference
  secondPrefDistribution: Record<number, number>;
  // Same for 3rd preference
  thirdPrefDistribution: Record<number, number>;
}

export interface ProvinceWithElectorates extends Province {
  electorates: Electorate[];
}

export interface ElectorateLLGData {
  electorateSlug: string;
  llgs: LLG[];
}

export interface ProvinceLLGData {
  provinceId: string;
  electorates: ElectorateLLGData[];
}
