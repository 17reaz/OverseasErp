import { supabase } from "@/lib/supabase/client";

/* =========================================================
   WORKFLOW
========================================================= */

export type DashboardWorkflowState =
  | "processing"
  | "hold";

export type DashboardHoldReason =
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

export function normalizeWorkflowState(
  value: unknown,
): DashboardWorkflowState {
  return value === "hold"
    ? "hold"
    : "processing";
}

/* =========================================================
   HOLD REASON LABEL
========================================================= */

function getHoldReasonLabel(
  reason: string,
): string {
  switch (reason) {
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
    /* -----------------------------------------------------
       TOTAL
    ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       ACTIVE

       Active includes:
       processing + hold
    ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       RETURNED
    ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       COMPLETE
    ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       CANCELLED
    ----------------------------------------------------- */

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
       MEDICAL
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

    supabase
      .from("medicals")
      .select(
        "candidate_id",
      )
      .eq(
        "status",
        "unfit",
      ),

    supabase
      .from("medicals")
      .select(
        "candidate_id",
      ),

    /* =====================================================
       MOFA
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
       VISA
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
       FLIGHT
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
    (activeCandidatesStageResult.data ??
      []) as DashboardWorkflowCandidate[];

  /* =======================================================
     WORKFLOW SPLIT
     
     Active
        │
        ├── processing
        │
        └── hold

     IMPORTANT:
     Hold is NOT removed from active.
     It is only removed from pipeline later.
  ======================================================= */

  const processingCandidates =
    activeStageCandidates.filter(
      (candidate) =>
        normalizeWorkflowState(
          candidate.workflow_state,
        ) === "processing",
    );

  const holdCandidates =
    activeStageCandidates.filter(
      (candidate) =>
        normalizeWorkflowState(
          candidate.workflow_state,
        ) === "hold",
    );

  /* =======================================================
     HOLD REASONS
  ======================================================= */

  const holdReasonMap =
    new Map<string, number>();

  for (const candidate of holdCandidates) {
    const reason =
      typeof candidate.hold_reason ===
      "string"
        ? candidate.hold_reason.trim()
        : "";

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
     
     Set is important because one candidate
     may have multiple medical records.

     Therefore:

       1 candidate
       1 count

     NOT:

       2 medical records
       2 candidates
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
     
     For now pending means:
     
       active candidate
       +
       no medical record

     Existing medical workflow remains untouched.
  ======================================================= */

  const medicalPending =
    activeCandidateIds.filter(
      (candidate) =>
        !medicalCandidateIds.has(
          candidate.id,
        ),
    ).length;

  /* =======================================================
     DISTINCT MEDICAL FIT / UNFIT
     
     We count candidate IDs, not medical rows.
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
     DISTINCT MOFA
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
     DISTINCT VISA
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
     DISTINCT FLIGHT
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
      /* ---------------------------------------------------
         MAIN KPI
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         WORKFLOW
         
         active =
           processing + hold
      --------------------------------------------------- */

      processingCandidates:
        processingCandidates.length,

      holdCandidates:
        holdCandidates.length,

      holdReasons,

      /* ---------------------------------------------------
         MEDICAL
      --------------------------------------------------- */

      medicalPending,

      medicalFit:
        medicalFitCandidateIds.size,

      medicalUnfit:
        medicalUnfitCandidateIds.size,

      /* ---------------------------------------------------
         MOFA
      --------------------------------------------------- */

      mofaPending:
        mofaPendingCandidateIds.size,

      mofaApproved:
        mofaApprovedCandidateIds.size,

      /* ---------------------------------------------------
         VISA
      --------------------------------------------------- */

      visaPending:
        visaPendingCandidateIds.size,

      visaIssued:
        visaIssuedCandidateIds.size,

      /* ---------------------------------------------------
         FLIGHT
      --------------------------------------------------- */

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