import { supabase } from "@/lib/supabase/client";

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
  workflow_state: DashboardWorkflowState;
  hold_reason: DashboardHoldReason;
}

export function normalizeWorkflowState(
  value: unknown,
): DashboardWorkflowState {
  return value === "hold"
    ? "hold"
    : "processing";
}

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
        .replace(/\b\w/g, (char) =>
          char.toUpperCase(),
        );
  }
}

export interface DashboardStatsContext {
  activeCandidateIds: {
    id: string;
  }[];

  activeStageCandidates: DashboardWorkflowCandidate[];

  medicalCandidateIds: Set<string>;

  bmetCandidateIds: Set<string>;
}

export async function getDashboardStats(): Promise<{
  stats: DashboardStats;
  context: DashboardStatsContext;
}> {
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
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .is("final_status", null);

  const activeCandidateIdsPromise =
    supabase
      .from("candidates")
      .select("id")
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .is("final_status", null);

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
    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false),

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .is("final_status", null),

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", true),

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .eq("final_status", "complete"),

    supabase
      .from("candidates")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_deleted", false)
      .eq("is_returned", false)
      .eq("final_status", "cancelled"),

    supabase
      .from("medicals")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "fit"),

    supabase
      .from("medicals")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "unfit"),

    supabase
      .from("medicals")
      .select("candidate_id"),

    supabase
      .from("mofas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("stage", [
        "new",
        "medupdated",
      ]),

    supabase
      .from("mofas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("stage", "approved"),

    supabase
      .from("visas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .not(
        "status",
        "in",
        "(issued,approved,cancelled,expired)",
      ),

    supabase
      .from("visas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "issued",
        "approved",
      ]),

    supabase
      .from("flights")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "scheduled"),

    supabase
      .from("flights")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "departed"),

    activeCandidateIdsPromise,

    activeCandidatesPromise,

    supabase
      .from("bmet")
      .select("candidate_id"),
  ]);

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

  const activeCandidateIds =
    activeCandidateIdsResult.data ?? [];

  const activeStageCandidates =
    (activeCandidatesStageResult.data ??
      []) as DashboardWorkflowCandidate[];

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
      (holdReasonMap.get(
        normalizedReason,
      ) ?? 0) + 1,
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
            getHoldReasonLabel(reason),
          count,
        }),
      );

  const medicalCandidateIds =
    new Set(
      (
        medicalCandidateIdsResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(Boolean),
    );

  const bmetCandidateIds =
    new Set(
      (
        bmetCandidateIdsResult.data ??
        []
      )
        .map(
          (item) =>
            item.candidate_id,
        )
        .filter(Boolean),
    );

  const medicalPending =
    activeCandidateIds.filter(
      (candidate) =>
        !medicalCandidateIds.has(
          candidate.id,
        ),
    ).length;

  return {
    stats: {
      totalCandidates:
        totalCandidatesResult.count ?? 0,

      activeCandidates:
        activeCandidatesResult.count ?? 0,

      completeCandidates:
        completeCandidatesResult.count ?? 0,

      returnedCandidates:
        returnedCandidatesResult.count ?? 0,

      cancelledCandidates:
        cancelledCandidatesResult.count ?? 0,

      processingCandidates:
        processingCandidates.length,

      holdCandidates:
        holdCandidates.length,

      holdReasons,

      medicalPending,

      medicalFit:
        medicalFitResult.count ?? 0,

      medicalUnfit:
        medicalUnfitResult.count ?? 0,

      mofaPending:
        mofaPendingResult.count ?? 0,

      mofaApproved:
        mofaApprovedResult.count ?? 0,

      visaPending:
        visaPendingResult.count ?? 0,

      visaIssued:
        visaIssuedResult.count ?? 0,

      flightScheduled:
        flightScheduledResult.count ?? 0,

      flightDeparted:
        flightDepartedResult.count ?? 0,
    },

    context: {
      activeCandidateIds,
      activeStageCandidates,
      medicalCandidateIds,
      bmetCandidateIds,
    },
  };
}