import type { Candidate } from "../types/candidate.types";

export async function getCandidates(): Promise<Candidate[]> {
  return [];
}

export async function getCandidate(
  _id: number
): Promise<Candidate | null> {
  return null;
}

export async function createCandidate(
  _data: Omit<Candidate, "id" | "createdAt">
): Promise<Candidate> {
  throw new Error("Not implemented");
}

export async function updateCandidate(
  _id: number,
  _data: Partial<Candidate>
): Promise<Candidate> {
  throw new Error("Not implemented");
}

export async function deleteCandidate(_id: number): Promise<void> {
  throw new Error("Not implemented");
}
