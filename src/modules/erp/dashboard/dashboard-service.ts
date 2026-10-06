import {
  getDashboardStats,
} from "./services/dashboard-stats-service";

import {
  getDashboardPipeline,
} from "./services/dashboard-pipeline-service";

import {
  getDashboardSupportData,
} from "./services/dashboard-support-service";
import {
  getDashboardCountryPassportData,
  type DashboardCountryPassport,
} from "./services/dashboard-country-service";
import {
  getDashboardUpcomingDeadlines,
  type DashboardDeadline,
} from "./services/dashboard-deadlines-service";
export type {
  DashboardWorkflowState,
  DashboardHoldReason,
  DashboardStats,
  DashboardWorkflowCandidate,
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
  workflow_state: DashboardWorkflowState;
  hold_reason: DashboardHoldReason;
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

  countryPassports: DashboardCountryPassport[];
  countries: string[];
  trend: {
    month: string;
    candidates: number;
  }[];

  aging: {
    label: string;
    count: number;
  }[];

  recentCandidates: DashboardCandidate[];

  upcomingDeadlines: DashboardDeadline[];

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
  /*
   * =====================================================
   * 1. DASHBOARD STATS
   * =====================================================
   */

  const {
    stats,
    context,
  } = await getDashboardStats();

  /*
   * =====================================================
   * 2. PROCESSING CANDIDATES ONLY
   *
   * Hold candidates NEVER enter the pipeline.
   *
   * processing:
   *   current_stage decides the ONE stage.
   *
   * hold:
   *   completely excluded from pipeline.
   * =====================================================
   */

 const processingCandidates =
  context.processingCandidates;

  /*
   * =====================================================
   * 3. EXCLUSIVE PIPELINE
   *
   * One candidate = one stage.
   *
   * Example:
   *
   * candidate A -> medical
   * candidate B -> mofa
   * candidate C -> visa
   *
   * Counts:
   *
   * Medical = 1
   * MOFA    = 1
   * Visa    = 1
   *
   * Candidate C is NOT counted in:
   * Medical/MOFA/Finger/etc.
   * =====================================================
   */

  const pipeline =
    getDashboardPipeline(
      processingCandidates,
    );

  /*
   * =====================================================
   * 4. SUPPORT DATA
   * =====================================================
   */

    const support =
    await getDashboardSupportData(
      context.activeCandidateIds,
      stats.medicalPending,
      stats.mofaPending,
      stats.holdCandidates,
    );

  const countryPassports =
    await getDashboardCountryPassportData();

  const upcomingDeadlines =
    await getDashboardUpcomingDeadlines(30);
  const countries = [
  ...new Set(
    countryPassports.map(
      (item) => item.country,
    ),
  ),
].sort();
  /*
   * =====================================================
   * 5. FINAL DASHBOARD DATA
   * =====================================================
   */

    return {
    stats,

    pipeline,
      countries,
    countryPassports,

    trend:
      support.trend,

    aging:
      support.aging,

    upcomingDeadlines,

    recentCandidates:
      support.recentCandidates,

    documentAlerts:
      support.documentAlerts,
  };
}