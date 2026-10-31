
import { orchestrator } from "@/lib/data/orchestrator";
import { getLiveWorkflowStates } from "../../workflow/workflow-service";

const supabase = orchestrator.supabase;

/* =========================================================
   TYPES
========================================================= */

export type DashboardWorkflowState = "processing" | "hold";

export type DashboardHoldReason =
  | "received"
  | "medical_expired"
  | "mofa_expired"
  | "visa_expired"
  | "iqama_overdue"
  | "manual_hold"
  | string
  | null;

export interface DashboardStats {
  totalCandidates: number;
  activeCandidates: number;
  completeCandidates: number;
  returnedCandidates: number;
  cancelledCandidates: number;

  processingCandidates: number;
  holdCandidates: number;

  holdReasons: {
    reason: string;
    label: string;
    count: number;
  }[];

  medicalPending: number;
  medicalFit: number;
  medicalUnfit: number;

  mofaPending: number;
  mofaApproved: number;

  visaPending: number;
  visaIssued: number;

  flightScheduled: number;
  flightDeparted: number;
}

export interface DashboardWorkflowCandidate {
  id: string;
  current_stage: string | null;
  requested_services:
    | Record<string, unknown>
    | null
    | undefined;
  workflow_state:
    | DashboardWorkflowState
    | null
    | undefined;
  hold_reason: DashboardHoldReason;
}

export interface DashboardStatsContext {
  activeCandidateIds: { id: string }[];
  activeStageCandidates: DashboardWorkflowCandidate[];
  processingCandidates: DashboardWorkflowCandidate[];
  medicalCandidateIds: Set<string>;
  bmetCandidateIds: Set<string>;
}

/* =========================================================
   HELPERS
========================================================= */

export function normalizeWorkflowState(
  value: unknown,
): DashboardWorkflowState {
  return value === "processing" ? "processing" : "hold";
}

function getHoldReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    received: "Received",
    medical_expired: "Medical Expired",
    mofa_expired: "MOFA Expired",
    visa_expired: "Visa Expired",
    iqama_overdue: "Iqama Overdue",
    manual_hold: "Manual Hold",
  };

  return (
    labels[reason] ??
    reason
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getUniqueCandidateIds(
  rows:
    | { candidate_id: string | null }[]
    | null
    | undefined,
): Set<string> {
  return new Set(
    (rows ?? [])
      .map((row) => row.candidate_id)
      .filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0,
      ),
  );
}

function throwQueryError(
  name: string,
  result: { error: { message: string } | null },
): void {
  if (result.error) {
    throw new Error(`${name}: ${result.error.message}`);
  }
}

/* =========================================================
   MAIN DASHBOARD STATS
========================================================= */

export async function getDashboardStats(): Promise<{
  stats: DashboardStats;
  context: DashboardStatsContext;
}> {
  /*
   * Active candidate:
   * is_deleted = false
   * is_returned = false
   * final_status IS NULL
   */

  const activeCandidatesQuery = supabase
    .from("candidates")
    .select(`
      id,
      current_stage,
      requested_services,
      workflow_state,
      hold_reason
    `)
    .eq("is_deleted", false)
    .eq("is_returned", false)
    .is("final_status", null);

  const activeCandidateIdsQuery = supabase
    .from("candidates")
    .select("id")
    .eq("is_deleted", false)
    .eq("is_returned", false)
    .is("final_status", null);

  /* =======================================================
     FETCH ALL DASHBOARD DATA
  ======================================================= */

  const [
    totalResult,
    activeResult,
    returnedResult,
    completeResult,
    cancelledResult,

    medicalFitResult,
    medicalUnfitResult,
    medicalAllResult,

    mofaPendingResult,
    mofaApprovedResult,

    visaPendingResult,
    visaIssuedResult,

    flightScheduledResult,
    flightDepartedResult,

    activeIdsResult,
    activeCandidatesResult,
    bmetResult,
  ] = await Promise.all([
    // Total candidates
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false),

    // Active candidates
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .is("final_status", null),

    // Returned
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("is_returned", true),

    // Complete
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .eq("final_status", "complete"),

    // Cancelled
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .eq("final_status", "cancelled"),

    // Medical fit
    supabase
      .from("medicals")
      .select("candidate_id")
      .eq("status", "fit"),

    // Medical unfit
    supabase
      .from("medicals")
      .select("candidate_id")
      .eq("status", "unfit"),

    // All medical records
    supabase
      .from("medicals")
      .select("candidate_id"),

    // MOFA pending
    supabase
      .from("mofas")
      .select("candidate_id")
      .in("stage", ["new", "medupdated"]),

    // MOFA approved
    supabase
      .from("mofas")
      .select("candidate_id")
      .eq("stage", "approved"),

    // Visa pending
    supabase
      .from("visas")
      .select("candidate_id")
      .in("status", ["processing", "active"]),

    // Visa issued
    supabase
      .from("visas")
      .select("candidate_id")
      .in("status", ["active", "delivered"]),

    // Flight scheduled
    supabase
      .from("flights")
      .select("candidate_id")
      .eq("status", "scheduled"),

    // Flight departed
    supabase
      .from("flights")
      .select("candidate_id")
      .eq("status", "departed"),

    // Active candidate IDs
    activeCandidateIdsQuery,

    // Active candidate stage data
    activeCandidatesQuery,

    // BMET candidate IDs
    supabase
      .from("bmet")
      .select("candidate_id"),
  ]);

  /* =======================================================
     QUERY ERROR HANDLING
     কোনো query fail করলে dashboard ভুল count দেখাবে না।
  ======================================================= */

  const queryResults = [
    ["Total candidates", totalResult],
    ["Active candidates", activeResult],
    ["Returned candidates", returnedResult],
    ["Complete candidates", completeResult],
    ["Cancelled candidates", cancelledResult],
    ["Medical fit", medicalFitResult],
    ["Medical unfit", medicalUnfitResult],
    ["Medical records", medicalAllResult],
    ["MOFA pending", mofaPendingResult],
    ["MOFA approved", mofaApprovedResult],
    ["Visa pending", visaPendingResult],
    ["Visa issued", visaIssuedResult],
    ["Flight scheduled", flightScheduledResult],
    ["Flight departed", flightDepartedResult],
    ["Active candidate IDs", activeIdsResult],
    ["Active candidate records", activeCandidatesResult],
    ["BMET records", bmetResult],
  ] as const;

  for (const [name, result] of queryResults) {
    throwQueryError(name, result);
  }

  /* =======================================================
     ACTIVE CANDIDATES
  ======================================================= */

  const activeCandidateIds = activeIdsResult.data ?? [];

  const activeStageCandidates =
    (activeCandidatesResult.data ??
      []) as DashboardWorkflowCandidate[];

  /* =======================================================
     LIVE WORKFLOW CALCULATION

     IMPORTANT:
     Live workflow calculation fail করলে fallback নয়।
     Error throw হবে, যাতে ভুল/stale pipeline count না আসে।
  ======================================================= */

  const liveWorkflowStates = await getLiveWorkflowStates(
    activeStageCandidates.map((candidate) => ({
      id: candidate.id,
      current_stage: candidate.current_stage,
      is_returned: false,
      final_status: null,
    })),
  );

  const processingCandidates =
    activeStageCandidates
      .filter((candidate) => {
        const live = liveWorkflowStates.get(candidate.id);

        const state = live
          ? live.workflowState
          : normalizeWorkflowState(candidate.workflow_state);

        return state === "processing";
      })
      .map((candidate) => {
        const live = liveWorkflowStates.get(candidate.id);

        return live
          ? {
              ...candidate,
              current_stage: live.currentStage,
              workflow_state: live.workflowState,
              hold_reason: live.holdReason,
            }
          : candidate;
      });

  const holdCandidates =
    activeStageCandidates.filter((candidate) => {
      const live = liveWorkflowStates.get(candidate.id);

      const state = live
        ? live.workflowState
        : normalizeWorkflowState(candidate.workflow_state);

      return state === "hold";
    });

  /* =======================================================
     HOLD REASONS
  ======================================================= */

  const holdReasonMap = new Map<string, number>();

  for (const candidate of holdCandidates) {
    const live = liveWorkflowStates.get(candidate.id);

    const reason =
      (live?.holdReason ?? candidate.hold_reason)?.trim() ||
      "manual_hold";

    holdReasonMap.set(
      reason,
      (holdReasonMap.get(reason) ?? 0) + 1,
    );
  }

  const holdReasons = Array.from(holdReasonMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({
      reason,
      label: getHoldReasonLabel(reason),
      count,
    }));

  /* =======================================================
     CANDIDATE ID SETS
  ======================================================= */

  const medicalCandidateIds = getUniqueCandidateIds(
    medicalAllResult.data,
  );

  const bmetCandidateIds = getUniqueCandidateIds(
    bmetResult.data,
  );

  const medicalFitCandidateIds = getUniqueCandidateIds(
    medicalFitResult.data,
  );

  const medicalUnfitCandidateIds = getUniqueCandidateIds(
    medicalUnfitResult.data,
  );

  const mofaPendingCandidateIds = getUniqueCandidateIds(
    mofaPendingResult.data,
  );

  const mofaApprovedCandidateIds = getUniqueCandidateIds(
    mofaApprovedResult.data,
  );

  const visaPendingCandidateIds = getUniqueCandidateIds(
    visaPendingResult.data,
  );

  const visaIssuedCandidateIds = getUniqueCandidateIds(
    visaIssuedResult.data,
  );

  const flightScheduledCandidateIds = getUniqueCandidateIds(
    flightScheduledResult.data,
  );

  const flightDepartedCandidateIds = getUniqueCandidateIds(
    flightDepartedResult.data,
  );

  /* =======================================================
     MEDICAL PENDING
  ======================================================= */

  const medicalPending = activeCandidateIds.filter(
    (candidate) => !medicalCandidateIds.has(candidate.id),
  ).length;

  /* =======================================================
     FINAL RESULT
  ======================================================= */

  return {
    stats: {
      totalCandidates: totalResult.count ?? 0,
      activeCandidates: activeResult.count ?? 0,
      completeCandidates: completeResult.count ?? 0,
      returnedCandidates: returnedResult.count ?? 0,
      cancelledCandidates: cancelledResult.count ?? 0,

      processingCandidates: processingCandidates.length,
      holdCandidates: holdCandidates.length,
      holdReasons,

      medicalPending,
      medicalFit: medicalFitCandidateIds.size,
      medicalUnfit: medicalUnfitCandidateIds.size,

      mofaPending: mofaPendingCandidateIds.size,
      mofaApproved: mofaApprovedCandidateIds.size,

      visaPending: visaPendingCandidateIds.size,
      visaIssued: visaIssuedCandidateIds.size,

      flightScheduled: flightScheduledCandidateIds.size,
      flightDeparted: flightDepartedCandidateIds.size,
    },

    context: {
      activeCandidateIds,
      activeStageCandidates,
      processingCandidates,
      medicalCandidateIds,
      bmetCandidateIds,
    },
  };
}
