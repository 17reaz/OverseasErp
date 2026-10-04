import { supabase } from "@/lib/supabase/client";

import type {
  CandidateWorkflowState,
  MainCandidateStatus,
} from "./workflow-types";

/* =========================================================
   VALIDITY RULES

   Medical = 60 days (own window, before MOFA starts)
   Medical→MOFA cascade = 60 + 30 = 90 days
   Visa    = 90 days (independent)
   Flight  → Iqama = 90 days
========================================================= */

export const WORKFLOW_VALIDITY = {
  medicalDays: 60,
  mofaDays: 30,
  visaDays: 90,
  iqamaDays: 90,
} as const;

/* =========================================================
   DATE HELPERS
========================================================= */

function addDays(dateString: string, days: number): Date {
  const date = new Date(dateString);

  date.setDate(date.getDate() + days);

  return date;
}

function isExpired(
  dateString: string | null | undefined,
  days: number,
): boolean {
  if (!dateString) return false;

  return (
    addDays(dateString, days).getTime() <
    Date.now()
  );
}

/* =========================================================
   NORMALIZE HELPERS
========================================================= */

function normalizeValue(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/* =========================================================
   MAIN CANDIDATE STATUS
========================================================= */

export function getMainCandidateStatus(
  candidate: {
    is_returned?: boolean | null;
    final_status?: string | null;
  },
): MainCandidateStatus {
  if (candidate.is_returned === true) {
    return "return";
  }

  if (candidate.final_status === "complete") {
    return "complete";
  }

  if (candidate.final_status === "cancelled") {
    return "cancel";
  }

  return "active";
}

/* =========================================================
   WORKFLOW INPUT
========================================================= */

interface WorkflowInput {
  is_returned?: boolean | null;
  final_status?: string | null;

  current_stage?: string | null;

  medicalDate?: string | null;
  medicalStatus?: string | null;

  mofaDate?: string | null;
  mofaStage?: string | null;

  visaDate?: string | null;
  visaExpiryDate?: string | null;
  visaStatus?: string | null;

  flightDate?: string | null;
  flightStatus?: string | null;

  iqamaCompleted?: boolean;
}

/* =========================================================
   CALCULATE WORKFLOW STATE

   IMPORTANT PIPELINE PRIORITY

   Candidate
      ↓
   Medical
      ↓
   MOFA
      ↓
   Visa
      ↓
   Flight
      ↓
   Iqama

   SPECIAL LIVE RULES:

   Flight exists + not departed
      → Flight

   Flight departed + Iqama incomplete
      → Iqama

   Flight departed + 90 days passed
      → Iqama + Hold

   These live flight rules have priority over stale
   candidates.current_stage values.
========================================================= */

export function calculateWorkflowState(
  input: WorkflowInput,
): CandidateWorkflowState {
  const mainStatus = getMainCandidateStatus(input);

  /* -------------------------------------------------------
     COMPLETE / RETURN / CANCEL
  ------------------------------------------------------- */

  if (mainStatus !== "active") {
    return {
      mainStatus,
      workflowState: "processing",
      currentStage: input.current_stage ?? null,
      holdReason: null,
    };
  }

  /* -------------------------------------------------------
     NORMALIZED VALUES
  ------------------------------------------------------- */

  const currentStage = normalizeValue(
    input.current_stage,
  );

  const flightStatus = normalizeValue(
    input.flightStatus,
  );

  const visaStatus = normalizeValue(
    input.visaStatus,
  );

  /* =======================================================
     FLIGHT DEPARTED → IQAMA

     THIS MUST COME BEFORE VISA.

     Example:

       candidates.current_stage = "visa"
       flights.status = "departed"

     Result:

       currentStage = "iqama"
   ======================================================= */

  if (
    flightStatus === "departed" &&
    input.iqamaCompleted !== true
  ) {
    /* -----------------------------------------------------
       IQAMA OVERDUE

       Flight departed
       +
       Iqama incomplete
       +
       90 days passed
     ----------------------------------------------------- */

    if (
      input.flightDate &&
      isExpired(
        input.flightDate,
        WORKFLOW_VALIDITY.iqamaDays,
      )
    ) {
      return {
        mainStatus: "active",
        workflowState: "hold",
        currentStage: "iqama",
        holdReason: "iqama_overdue",
      };
    }

    /* -----------------------------------------------------
       FLIGHT DEPARTED BUT IQAMA STILL PROCESSING
     ----------------------------------------------------- */

    return {
      mainStatus: "active",
      workflowState: "processing",
      currentStage: "iqama",
      holdReason: null,
    };
  }

  /* =======================================================
     FLIGHT EXISTS → FLIGHT

     Any active flight record means the candidate has
     progressed beyond Visa.

     This prevents:

       current_stage = visa
       flight.status = scheduled

     from continuing to display Visa.

     Cancelled flights are ignored.
   ======================================================= */

  if (
    flightStatus &&
    flightStatus !== "cancelled"
  ) {
    return {
      mainStatus: "active",
      workflowState: "processing",
      currentStage: "flight",
      holdReason: null,
    };
  }

  /* =======================================================
     EXPLICIT VISA STAGE

     If candidate has already reached Visa and there is
     no active Flight, Visa becomes authoritative.

     Visa expiration is still checked here.
   ======================================================= */

  if (currentStage === "visa") {
    const visaIsExpired =
      visaStatus === "expired" ||
      Boolean(
        input.visaExpiryDate &&
          new Date(
            input.visaExpiryDate,
          ).getTime() < Date.now(),
      ) ||
      Boolean(
        !input.visaExpiryDate &&
          input.visaDate &&
          isExpired(
            input.visaDate,
            WORKFLOW_VALIDITY.visaDays,
          ),
      );

    if (visaIsExpired) {
      return {
        mainStatus: "active",
        workflowState: "hold",
        currentStage: "visa",
        holdReason: "visa_expired",
      };
    }

    return {
      mainStatus: "active",
      workflowState: "processing",
      currentStage: "visa",
      holdReason: null,
    };
  }

  /* =======================================================
     MEDICAL NOT STARTED

     No medical record/status means:

       ACTIVE
       +
       HOLD
       +
       RECEIVED
   ======================================================= */

  if (!input.medicalStatus) {
    return {
      mainStatus: "active",
      workflowState: "hold",
      currentStage: input.current_stage ?? null,
      holdReason: "received",
    };
  }

  /* =======================================================
     MEDICAL PENDING
   ======================================================= */

  if (input.medicalStatus === "new") {
    return {
      mainStatus: "active",
      workflowState: "hold",
      currentStage:
        input.current_stage ?? "medical",
      holdReason: "received",
    };
  }

  /* =======================================================
     MEDICAL UNFIT
   ======================================================= */

  if (input.medicalStatus === "unfit") {
    return {
      mainStatus: "active",
      workflowState: "hold",
      currentStage:
        input.current_stage ?? "medical",
      holdReason: "manual_hold",
    };
  }

  /* =======================================================
     VISA ISSUED → MEDICAL/MOFA CASCADE STOPS

     Once Visa is issued/approved, Visa controls the
     validity independently.
   ======================================================= */

  const visaIsIssued = Boolean(
    input.visaStatus &&
      ["issued", "approved"].includes(
        normalizeValue(input.visaStatus),
      ),
  );

  /* =======================================================
     MEDICAL FIT → MOFA CASCADE

     Medical:
       60 days

     Medical + MOFA started:
       60 + 30 = 90 days
   ======================================================= */

  if (
    !visaIsIssued &&
    input.medicalStatus === "fit" &&
    input.medicalDate
  ) {
    const mofaStarted = Boolean(
      input.mofaDate,
    );

    const cascadeDays = mofaStarted
      ? WORKFLOW_VALIDITY.medicalDays +
        WORKFLOW_VALIDITY.mofaDays
      : WORKFLOW_VALIDITY.medicalDays;

    if (
      isExpired(
        input.medicalDate,
        cascadeDays,
      )
    ) {
      return {
        mainStatus: "active",
        workflowState: "hold",
        currentStage:
          input.current_stage ??
          (mofaStarted
            ? "mofa"
            : "medical"),
        holdReason: mofaStarted
          ? "mofa_expired"
          : "medical_expired",
      };
    }
  }

  /* =======================================================
     VISA ISSUED / APPROVED

     expiry_date is authoritative.

     If expiry_date doesn't exist:
       visa_date + 90 days
   ======================================================= */

  if (visaIsIssued) {
    if (input.visaExpiryDate) {
      if (
        new Date(
          input.visaExpiryDate,
        ).getTime() < Date.now()
      ) {
        return {
          mainStatus: "active",
          workflowState: "hold",
          currentStage:
            input.current_stage ?? "visa",
          holdReason: "visa_expired",
        };
      }
    } else if (input.visaDate) {
      if (
        isExpired(
          input.visaDate,
          WORKFLOW_VALIDITY.visaDays,
        )
      ) {
        return {
          mainStatus: "active",
          workflowState: "hold",
          currentStage:
            input.current_stage ?? "visa",
          holdReason: "visa_expired",
        };
      }
    }
  }

  /* =======================================================
     DEFAULT ACTIVE WORKING STATE
   ======================================================= */

  return {
    mainStatus: "active",
    workflowState: "processing",
    currentStage:
      input.current_stage ?? null,
    holdReason: null,
  };
}

/* =========================================================
   SAVE WORKFLOW STATE
========================================================= */

export async function saveWorkflowState(
  candidateId: string,
  state: CandidateWorkflowState,
): Promise<void> {
  const { error } = await supabase
    .from("candidates")
    .update({
      workflow_state:
        state.workflowState,

      hold_reason:
        state.holdReason,

      current_stage:
        state.currentStage,

      workflow_updated_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    throw error;
  }
}

/* =========================================================
   GET ONE CANDIDATE WORKFLOW
========================================================= */

export async function getCandidateWorkflow(
  candidateId: string,
): Promise<CandidateWorkflowState> {
  const [
    candidateResult,
    medicalResult,
    mofaResult,
    visaResult,
    flightResult,
  ] = await Promise.all([
    supabase
      .from("candidates")
      .select(`
        id,
        current_stage,
        is_returned,
        final_status
      `)
      .eq("id", candidateId)
      .single(),

    supabase
      .from("medicals")
      .select(`
        medical_date,
        fit_date,
        status,
        created_at
      `)
      .eq("candidate_id", candidateId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("mofas")
      .select(`
        application_date,
        stage,
        created_at
      `)
      .eq("candidate_id", candidateId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("visas")
      .select(`
        visa_date,
        expiry_date,
        status,
        created_at
      `)
      .eq("candidate_id", candidateId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("flights")
      .select(`
        flight_date,
        status,
        created_at
      `)
      .eq("candidate_id", candidateId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  if (candidateResult.error) {
    throw candidateResult.error;
  }

  if (medicalResult.error) {
    throw medicalResult.error;
  }

  if (mofaResult.error) {
    throw mofaResult.error;
  }

  if (visaResult.error) {
    throw visaResult.error;
  }

  if (flightResult.error) {
    throw flightResult.error;
  }

  const candidate =
    candidateResult.data;

  const medical =
    medicalResult.data;

  const mofa =
    mofaResult.data;

  const visa =
    visaResult.data;

  const flight =
    flightResult.data;

  return calculateWorkflowState({
    is_returned:
      candidate.is_returned,

    final_status:
      candidate.final_status,

    current_stage:
      candidate.current_stage,

    medicalDate:
      medical?.fit_date ??
      medical?.medical_date ??
      null,

    medicalStatus:
      medical?.status ?? null,

    mofaDate:
      mofa?.application_date ?? null,

    mofaStage:
      mofa?.stage ?? null,

    visaDate:
      visa?.visa_date ?? null,

    visaExpiryDate:
      visa?.expiry_date ?? null,

    visaStatus:
      visa?.status ?? null,

    flightDate:
      flight?.flight_date ?? null,

    flightStatus:
      flight?.status ?? null,

    /*
     * Iqama is not yet fetched from a dedicated table.
     * Until the Iqama module exists, departed candidates
     * are considered incomplete.
     */
    iqamaCompleted: false,
  });
}

/* =========================================================
   SYNC ONE CANDIDATE WORKFLOW STATE
========================================================= */

export async function syncCandidateWorkflowState(
  candidateId: string,
): Promise<void> {
  const state =
    await getCandidateWorkflow(
      candidateId,
    );

  await saveWorkflowState(
    candidateId,
    state,
  );
}

/* =========================================================
   LIVE WORKFLOW STATES
   ---------------------------------------------------------
   Batch/non-persisting calculation for dashboard and
   candidate list.

   Avoids N+1 queries.
========================================================= */

export interface WorkflowCandidateInput {
  id: string;
  current_stage: string | null;
  is_returned?: boolean | null;
  final_status?: string | null;
}

function latestRowsByCandidate<
  T extends {
    candidate_id: string;
  },
>(
  rows: T[] | null | undefined,
): Map<string, T> {
  const map =
    new Map<string, T>();

  /*
   * Queries are ordered by created_at DESC,
   * therefore the first row for each candidate
   * is the latest record.
   */
  for (const row of rows ?? []) {
    if (!map.has(row.candidate_id)) {
      map.set(
        row.candidate_id,
        row,
      );
    }
  }

  return map;
}

export async function getLiveWorkflowStates(
  candidates: WorkflowCandidateInput[],
): Promise<
  Map<string, CandidateWorkflowState>
> {
  const result =
    new Map<
      string,
      CandidateWorkflowState
    >();

  if (candidates.length === 0) {
    return result;
  }

  const candidateIds =
    candidates.map(
      (candidate) =>
        candidate.id,
    );

  const [
    medicalsResult,
    mofasResult,
    visasResult,
    flightsResult,
  ] = await Promise.all([
    supabase
      .from("medicals")
      .select(
        "candidate_id, medical_date, fit_date, status, created_at",
      )
      .in(
        "candidate_id",
        candidateIds,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from("mofas")
      .select(
        "candidate_id, application_date, stage, created_at",
      )
      .in(
        "candidate_id",
        candidateIds,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from("visas")
      .select(
        "candidate_id, visa_date, expiry_date, status, created_at",
      )
      .in(
        "candidate_id",
        candidateIds,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from("flights")
      .select(
        "candidate_id, flight_date, status, created_at",
      )
      .in(
        "candidate_id",
        candidateIds,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),
  ]);

  if (medicalsResult.error) {
    throw medicalsResult.error;
  }

  if (mofasResult.error) {
    throw mofasResult.error;
  }

  if (visasResult.error) {
    throw visasResult.error;
  }

  if (flightsResult.error) {
    throw flightsResult.error;
  }

  const latestMedical =
    latestRowsByCandidate(
      medicalsResult.data as
        | ({
            candidate_id: string;
          } & Record<
            string,
            unknown
          >)[]
        | null,
    );

  const latestMofa =
    latestRowsByCandidate(
      mofasResult.data as
        | ({
            candidate_id: string;
          } & Record<
            string,
            unknown
          >)[]
        | null,
    );

  const latestVisa =
    latestRowsByCandidate(
      visasResult.data as
        | ({
            candidate_id: string;
          } & Record<
            string,
            unknown
          >)[]
        | null,
    );

  const latestFlight =
    latestRowsByCandidate(
      flightsResult.data as
        | ({
            candidate_id: string;
          } & Record<
            string,
            unknown
          >)[]
        | null,
    );

  for (const candidate of candidates) {
    const medical =
      latestMedical.get(
        candidate.id,
      ) as
        | {
            medical_date:
              | string
              | null;
            fit_date:
              | string
              | null;
            status:
              | string
              | null;
          }
        | undefined;

    const mofa =
      latestMofa.get(
        candidate.id,
      ) as
        | {
            application_date:
              | string
              | null;
            stage:
              | string
              | null;
          }
        | undefined;

    const visa =
      latestVisa.get(
        candidate.id,
      ) as
        | {
            visa_date:
              | string
              | null;
            expiry_date:
              | string
              | null;
            status:
              | string
              | null;
          }
        | undefined;

    const flight =
      latestFlight.get(
        candidate.id,
      ) as
        | {
            flight_date:
              | string
              | null;
            status:
              | string
              | null;
          }
        | undefined;

    const state =
      calculateWorkflowState({
        is_returned:
          candidate.is_returned ??
          false,

        final_status:
          candidate.final_status ??
          null,

        current_stage:
          candidate.current_stage,

        medicalDate:
          medical?.fit_date ??
          medical?.medical_date ??
          null,

        medicalStatus:
          medical?.status ??
          null,

        mofaDate:
          mofa?.application_date ??
          null,

        mofaStage:
          mofa?.stage ??
          null,

        visaDate:
          visa?.visa_date ??
          null,

        visaExpiryDate:
          visa?.expiry_date ??
          null,

        visaStatus:
          visa?.status ??
          null,

        flightDate:
          flight?.flight_date ??
          null,

        flightStatus:
          flight?.status ??
          null,

        /*
         * Iqama is not yet fetched from a
         * dedicated table.
         */
        iqamaCompleted: false,
      });

    result.set(
      candidate.id,
      state,
    );
  }

  return result;
}