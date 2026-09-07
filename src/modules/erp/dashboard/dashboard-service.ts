import {
  getDashboardStats,
  normalizeWorkflowState,
} from "./services/dashboard-stats-service";

import {
  getDashboardPipeline,
} from "./services/dashboard-pipeline-service";

import {
  getDashboardSupportData,
} from "./services/dashboard-support-service";

export type {
  DashboardWorkflowState,
  DashboardHoldReason,
  DashboardStats,
} from "./services/dashboard-stats-service";

import type {
  DashboardWorkflowState,
  DashboardHoldReason,
} from "./services/dashboard-stats-service";

export interface DashboardCandidate {
  id: string;
  name: string;
  passport_no: string;
  created_at: string;
  current_stage: string | null;
  is_returned: boolean;
  workflow_state:
    DashboardWorkflowState;
  hold_reason:
    DashboardHoldReason;
}

export interface DashboardData {
  stats: {
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
  };

  pipeline: {
    key:
      | "active"
      | "medical"
      | "mofa"
      | "finger"
      | "police_clearance"
      | "takamul"
      | "visa"
      | "bmet"
      | "flight"
      | "iqama";

    label: string;
    value: number;
  }[];

  trend: {
    month: string;
    candidates: number;
  }[];

  aging: {
    label: string;
    count: number;
  }[];

  recentCandidates:
    DashboardCandidate[];

  documentAlerts: {
    title: string;
    description: string;
    count: number;
    level:
      | "critical"
      | "warning"
      | "info";
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  /* =====================================================
     1. STATS
     
     Existing candidate/status/KPI logic stays here
     through dashboard-stats-service.
  ===================================================== */

  const {
    stats,
    context,
  } = await getDashboardStats();

  /* =====================================================
     2. PROCESSING CANDIDATES
     
     Hold candidates NEVER enter pipeline.
  ===================================================== */

  const processingCandidates =
    context.activeStageCandidates.filter(
      (candidate) =>
        normalizeWorkflowState(
          candidate.workflow_state,
        ) === "processing",
    );

  /* =====================================================
     3. PIPELINE
     
     Existing cumulative pipeline logic is preserved.
  ===================================================== */

  const pipeline =
    getDashboardPipeline(
      processingCandidates,
      context.bmetCandidateIds,
    );

  /* =====================================================
     4. SUPPORT DATA
     
     Trend / Aging / Recent / Alerts.
  ===================================================== */

  const support =
    await getDashboardSupportData(
      context.activeCandidateIds,
      stats.medicalPending,
      stats.mofaPending,
      stats.holdCandidates,
    );

  /* =====================================================
     5. FINAL RESULT
  ===================================================== */

  return {
    stats,

    pipeline,

    trend:
      support.trend,

    aging:
      support.aging,

    recentCandidates:
      support.recentCandidates,

    documentAlerts:
      support.documentAlerts,
  };
}