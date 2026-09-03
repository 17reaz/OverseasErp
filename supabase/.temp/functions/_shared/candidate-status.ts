// supabase/functions/_shared/candidate-status.ts
//
// Mirrors src/modules/erp/candidates/candidate-selectors.ts
// (getCandidateOverallStatus, base case without moduleStatus context).
// Kept as a small standalone copy because Edge Functions run on Deno
// and should not import the frontend React app's module graph.
// If the frontend resolver's priority order changes, update here too.

export interface CandidateStatusFields {
  final_status: "complete" | "cancelled" | null;
  is_returned: boolean;
}

export function deriveCandidateDisplayStatus(
  candidate: CandidateStatusFields,
): "complete" | "cancelled" | "returned" | "active" {
  if (candidate.final_status === "complete") return "complete";
  if (candidate.final_status === "cancelled") return "cancelled";
  if (candidate.is_returned) return "returned";
  return "active";
}
