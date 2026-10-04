
import type { Candidate } from "./candidate-types";
import { getCandidatesFromEngine } from "./candidate-data-engine";
import { CANDIDATE_SELECT } from "./candidate-query";

export { CANDIDATE_SELECT };

export async function getCachedCandidatesFirst(): Promise<Candidate[]> {
  return getCandidatesFromEngine();
}

// Keep the existing function contract.
// Do not perform another full database fetch.
export async function refreshCandidatesCache(): Promise<Candidate[]> {
  return getCandidatesFromEngine();
}