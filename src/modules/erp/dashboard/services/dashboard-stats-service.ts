import { supabase } from "@/lib/supabase/client";

import {
  getLiveWorkflowStates,
} from "../../workflow/workflow-service";

import type {
  CandidateWorkflowState,
} from "../../workflow/workflow-types";

/* =========================================================
   WORKFLOW
========================================================= */

export type DashboardWorkflowState =
  | "processing"
  | "hold";

export type DashboardHoldReason =
  | "received"
  | "medical_expired"
  | "mofa_expired"
  | "visa_expired"
  | "iqama_overdue"
  | "manual_hold"
  | string
  | null;

/* =========================================================
   DASHBOARD STATS
========================================================= */

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

/* =========================================================
   ACTIVE CANDIDATE
========================================================= */

export interface DashboardWorkflowCandidate {
  id: string;

  current_stage:
    | string
    | null;

  requested_services:
    | Record<string, unknown>
    | null
    | undefined;

  workflow_state:
    | DashboardWorkflowState
    | null
    | undefined;

  hold_reason:
    | DashboardHoldReason;
}

/* =========================================================
   NORMALIZE WORKFLOW STATE
========================================================= */

/**
 * Workflow rule:
 *
 * processing = actual work has started
 * hold       = not currently processing
 *
 * IMPORTANT:
 * null / undefined is treated as HOLD.
 *
 * This is intentional because a newly created
 * candidate should not automatically appear
 * inside the processing pipeline.
 */
export function normalizeWorkflowState(
  value: unknown,
): DashboardWorkflowState {
  return value === "processing"
    ? "processing"
    : "hold";
}
/* =========================================================
   HOLD REASON LABEL
========================================================= */

function getHoldReasonLabel(
  reason: string,
): string {
  switch (reason) {
    case "received":
      return "Received";

    case "medical_expired":
      return "Medical Expired";

    case "mofa_expired":
      return "MOFA Expired";

    case "visa_expired":
      return "Visa Expired";

    case "iqama_overdue":
      return "Iqama Overdue";

    case "manual_hold":
      return "Manual Hold";

    default:
      return reason
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ")
        .replace(
          /\b\w/g,
          (char) => char.toUpperCase(),
        );
  }
}

/* =========================================================
   DASHBOARD CONTEXT
========================================================= */

export interface DashboardStatsContext {
  /*
   * All active candidates.
   *
   * active =
   *   processing + hold
   */
  activeCandidateIds: {
    id: string;
  }[];

  /*
   * Active candidates with workflow information.
   */
  activeStageCandidates:
    DashboardWorkflowCandidate[];

  /*
   * Candidates that have at least one
   * medical record.
   */
  medicalCandidateIds:
    Set<string>;

  /*
   * Candidates that have at least one
   * BMET record.
   */
  bmetCandidateIds:
    Set<string>;
}

/* =========================================================
   MAIN
========================================================= */

export async function getDashboardStats(): Promise<{
  stats: DashboardStats;
  context: DashboardStatsContext;
}> {
  /* =======================================================
     ACTIVE CANDIDATES
     
     Active means:
     
       is_deleted = false
       is_returned = false
       final_status IS NULL
     
     This intentionally includes BOTH:
     
       processing
       hold
     
     Example:
     
       New candidate
          ↓
       active + hold
     
       Medical completed
          ↓
       active + processing
  ======================================================= */

  const activeCandidatesPromise =
    supabase
      .from("candidates")
      .select(
        `
        id,
        current_stage,
        requested_services,
        workflow_state,
        hold_reason
        `,
      )
      .eq(
        "is_deleted",
        false,
      )
      .eq(
        "is_returned",
        false,
      )
      .is(
        "final_status",
        null,
      );

  const activeCandidateIdsPromise =
    supabase
      .from("candidates")
      .select("id")
      .eq(
        "is_deleted",
        false,
      )
      .eq(
        "is_returned",
        false,
      )
      .is(
        "final_status",
        null,
      );

  /* =======================================================
     ALL DASHBOARD QUERIES
  ======================================================= */

  const [
    totalCandidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,
    completeCandidatesResult,
    cancelledCandidatesResult,

    medicalFitResult,
    medicalUnfitResult,
    medicalCandidateIdsResult,

    mofaPendingResult,
    mofaApprovedResult,

    visaPendingResult,
    visaIssuedResult,

    flightScheduledResult,
    flightDepartedResult,

    activeCandidateIdsResult,
    activeCandidatesStageResult,

    bmetCandidateIdsResult,
  ] = await Promise.all([
    /* =====================================================
       TOTAL
    ===================================================== */

    supabase
      .from("candidates")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "is_deleted",
        false,
      ),

    /* =====================================================
       ACTIVE

       Active =
         processing + hold
    ===================================================== */

    supabase
      .from("candidates")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "is_deleted",
        false,
      )
      .eq(
        "is_returned",
        false,
      )
      .is(
        "final_status",
        null,
      ),

    /* =====================================================
       RETURNED
    ===================================================== */

    supabase
      .from("candidates")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "is_deleted",
        false,
      )
      .eq(
        "is_returned",
        true,
      ),

    /* =====================================================
       COMPLETE
    ===================================================== */

    supabase
      .from("candidates")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "is_deleted",
        false,
      )
      .eq(
        "is_returned",
        false,
      )
      .eq(
        "final_status",
        "complete",
      ),

    /* =====================================================
       CANCELLED
    ===================================================== */

    supabase
      .from("candidates")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "is_deleted",
        false,
      )
      .eq(
        "is_returned",
        false,
      )
      .eq(
        "final_status",
        "cancelled",
      ),

    /* =====================================================
       MEDICAL - FIT
    ===================================================== */

    supabase
      .from("medicals")
      .select(
        "candidate_id",
      )
      .eq(
        "status",
        "fit",
      ),

    /* =====================================================
       MEDICAL - UNFIT
    ===================================================== */

    supabase
      .from("medicals")
      .select(
        "candidate_id",
      )
      .eq(
        "status",
        "unfit",
      ),

    /* =====================================================
       MEDICAL - ALL RECORDS
    ===================================================== */

    supabase
      .from("medicals")
      .select(
        "candidate_id",
      ),

    /* =====================================================
       MOFA - PENDING
    ===================================================== */

    supabase
      .from("mofas")
      .select(
        "candidate_id",
      )
      .in(
        "stage",
        [
          "new",
          "medupdated",
        ],
      ),

    /* =====================================================
       MOFA - APPROVED
    ===================================================== */

    supabase
      .from("mofas")
      .select(
        "candidate_id",
      )
      .eq(
        "stage",
        "approved",
      ),

    /* =====================================================
       VISA - PENDING
    ===================================================== */

    supabase
      .from("visas")
      .select(
        "candidate_id",
      )
      .not(
        "status",
        "in",
        "(issued,approved,cancelled,expired)",
      ),

    /* =====================================================
       VISA - ISSUED
    ===================================================== */

    supabase
      .from("visas")
      .select(
        "candidate_id",
      )
      .in(
        "status",
        [
          "issued",
          "approved",
        ],
      ),

    /* =====================================================
       FLIGHT - SCHEDULED
    ===================================================== */

    supabase
      .from("flights")
      .select(
        "candidate_id",
      )
      .eq(
        "status",
        "scheduled",
      ),

    /* =====================================================
       FLIGHT - DEPARTED
    ===================================================== */

    supabase
      .from("flights")
      .select(
        "candidate_id",
      )
      .eq(
        "status",
        "departed",
      ),

    /* =====================================================
       ACTIVE IDS
    ===================================================== */

    activeCandidateIdsPromise,

    /* =====================================================
       ACTIVE STAGE CANDIDATES
    ===================================================== */

    activeCandidatesPromise,

    /* =====================================================
       BMET
    ===================================================== */

    supabase
      .from("bmet")
      .select(
        "candidate_id",
      ),
  ]);

  /* =======================================================
     ERROR HANDLING
  ======================================================= */

  const results = [
    totalCandidatesResult,
    activeCandidatesResult,
    returnedCandidatesResult,
    completeCandidatesResult,
    cancelledCandidatesResult,

    medicalFitResult,
    medicalUnfitResult,
    medicalCandidateIdsResult,

    mofaPendingResult,
    mofaApprovedResult,

    visaPendingResult,
    visaIssuedResult,

    flightScheduledResult,
    flightDepartedResult,

    activeCandidateIdsResult,
    activeCandidatesStageResult,

    bmetCandidateIdsResult,
  ];

  for (const result of results) {
    if (result.error) {
      throw result.error;
    }
  }

  /* =======================================================
     ACTIVE CANDIDATES
  ======================================================= */

  const activeCandidateIds =
    activeCandidateIdsResult.data ??
    [];

  const activeStageCandidates =
    (
      activeCandidatesStageResult.data ??
      []
    ) as DashboardWorkflowCandidate[];

  /* =======================================================
     LIVE WORKFLOW RECALCULATION

     workflow_state/hold_reason column stale হতে পারে —
     persist না করেই এখানে medical/mofa/visa/flight data
     দিয়ে live recompute করা হচ্ছে, যাতে শুধু সময় পার হয়ে
     validity expire হলেও (কোনো record edit ছাড়াই) dashboard
     ঠিক Processing/Hold count দেখায়।
  ======================================================= */

  let liveWorkflowStates =
    new Map<string, CandidateWorkflowState>();

  try {

    liveWorkflowStates =
      await getLiveWorkflowStates(
        activeStageCandidates.map(
          (candidate) => ({
            id: candidate.id,
            current_stage: candidate.current_stage,
            is_returned: false,
            final_status: null,
          }),
        ),
      );

  } catch (liveError) {

    console.error(
      "Failed to compute live workflow states for dashboard:",
      liveError,
    );

  }

  function resolveWorkflowState(
    candidate: DashboardWorkflowCandidate,
  ): DashboardWorkflowState {

    const live =
      liveWorkflowStates.get(candidate.id);

    if (live) {
      return live.workflowState;
    }

    return normalizeWorkflowState(
      candidate.workflow_state,
    );

  }

  function resolveHoldReason(
    candidate: DashboardWorkflowCandidate,
  ): DashboardHoldReason {

    const live =
      liveWorkflowStates.get(candidate.id);

    if (live) {
      return live.holdReason;
    }

    return candidate.hold_reason;

  }

  /* =======================================================
     WORKFLOW SPLIT

     ACTIVE
       │
       ├── HOLD
       │    ├── Received
       │    ├── Medical Expired
       │    ├── MOFA Expired
       │    ├── Visa Expired
       │    ├── Iqama Overdue
       │    └── Manual Hold
       │
       └── PROCESSING
            └── Pipeline stages

     IMPORTANT:

     Hold candidates remain ACTIVE.

     But they are NOT included in
     processing/pipeline counts.
  ======================================================= */

  const processingCandidates =
    activeStageCandidates.filter(
      (candidate) =>
        resolveWorkflowState(candidate) ===
        "processing",
    );

  const holdCandidates =
    activeStageCandidates.filter(
      (candidate) =>
        resolveWorkflowState(candidate) ===
        "hold",
    );

  /* =======================================================
     HOLD REASONS
  ======================================================= */

  const holdReasonMap =
    new Map<string, number>();

  for (const candidate of holdCandidates) {
    const candidateHoldReason =
      resolveHoldReason(candidate);

    const reason =
      typeof candidateHoldReason ===
      "string"
        ? candidateHoldReason.trim()
        : "";

    /*
     * If workflow_state is hold but
     * hold_reason is missing, keep it
     * under manual_hold instead of
     * breaking dashboard counting.
     */
    const normalizedReason =
      reason || "manual_hold";

    holdReasonMap.set(
      normalizedReason,
      (
        holdReasonMap.get(
          normalizedReason,
        ) ?? 0
      ) + 1,
    );
  }

  const holdReasons =
    Array.from(
      holdReasonMap.entries(),
    )
      .sort(
        ([, countA], [, countB]) =>
          countB - countA,
      )
      .map(
        ([reason, count]) => ({
          reason,

          label:
            getHoldReasonLabel(
              reason,
            ),

          count,
        }),
      );

  /* =======================================================
     MEDICAL CANDIDATE SET
     
     A candidate can have multiple
     medical records.
     
     Therefore use Set.
  ======================================================= */

  const medicalCandidateIds =
    new Set<string>(
      (
        medicalCandidateIdsResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     BMET CANDIDATE SET
  ======================================================= */

  const bmetCandidateIds =
    new Set<string>(
      (
        bmetCandidateIdsResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     MEDICAL PENDING
     
     Active candidate
     +
     no medical record
     
     = pending medical
  ======================================================= */

  const medicalPending =
    activeCandidateIds.filter(
      (candidate) =>
        !medicalCandidateIds.has(
          candidate.id,
        ),
    ).length;

  /* =======================================================
     MEDICAL FIT
     
     DISTINCT candidate IDs
  ======================================================= */

  const medicalFitCandidateIds =
    new Set<string>(
      (
        medicalFitResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     MEDICAL UNFIT
     
     DISTINCT candidate IDs
  ======================================================= */

  const medicalUnfitCandidateIds =
    new Set<string>(
      (
        medicalUnfitResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     MOFA PENDING
     
     DISTINCT candidate IDs
  ======================================================= */

  const mofaPendingCandidateIds =
    new Set<string>(
      (
        mofaPendingResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     MOFA APPROVED
     
     DISTINCT candidate IDs
  ======================================================= */

  const mofaApprovedCandidateIds =
    new Set<string>(
      (
        mofaApprovedResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     VISA PENDING
     
     DISTINCT candidate IDs
  ======================================================= */

  const visaPendingCandidateIds =
    new Set<string>(
      (
        visaPendingResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     VISA ISSUED
     
     DISTINCT candidate IDs
  ======================================================= */

  const visaIssuedCandidateIds =
    new Set<string>(
      (
        visaIssuedResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     FLIGHT SCHEDULED
     
     DISTINCT candidate IDs
  ======================================================= */

  const flightScheduledCandidateIds =
    new Set<string>(
      (
        flightScheduledResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     FLIGHT DEPARTED
     
     DISTINCT candidate IDs
  ======================================================= */

  const flightDepartedCandidateIds =
    new Set<string>(
      (
        flightDepartedResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    );

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    stats: {
      /* ===================================================
         MAIN KPI
      =================================================== */

      totalCandidates:
        totalCandidatesResult.count ??
        0,

      activeCandidates:
        activeCandidatesResult.count ??
        0,

      completeCandidates:
        completeCandidatesResult.count ??
        0,

      returnedCandidates:
        returnedCandidatesResult.count ??
        0,

      cancelledCandidates:
        cancelledCandidatesResult.count ??
        0,

      /* ===================================================
         WORKFLOW
         
         active =
           processing + hold
         
         pipeline =
           processing only
      =================================================== */

      processingCandidates:
        processingCandidates.length,

      holdCandidates:
        holdCandidates.length,

      holdReasons,

      /* ===================================================
         MEDICAL
      =================================================== */

      medicalPending,

      medicalFit:
        medicalFitCandidateIds.size,

      medicalUnfit:
        medicalUnfitCandidateIds.size,

      /* ===================================================
         MOFA
      =================================================== */

      mofaPending:
        mofaPendingCandidateIds.size,

      mofaApproved:
        mofaApprovedCandidateIds.size,

      /* ===================================================
         VISA
      =================================================== */

      visaPending:
        visaPendingCandidateIds.size,

      visaIssued:
        visaIssuedCandidateIds.size,

      /* ===================================================
         FLIGHT
      =================================================== */

      flightScheduled:
        flightScheduledCandidateIds.size,

      flightDeparted:
        flightDepartedCandidateIds.size,
    },

    context: {
      activeCandidateIds,

      activeStageCandidates,

      medicalCandidateIds,

      bmetCandidateIds,
    },
  };
}