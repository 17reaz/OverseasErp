import { supabase } from "@/lib/supabase/client";

import type {
  CandidateWorkflowState,
  MainCandidateStatus,
} from "./workflow-types";

/* =========================================================
   VALIDITY RULES

   Medical = 60 days
   MOFA    = 30 days
   Visa    = 90 days
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

function addDays(
  dateString: string,
  days: number,
): Date {
  const date = new Date(dateString);

  date.setDate(
    date.getDate() + days,
  );

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

  if (
    candidate.final_status === "complete"
  ) {
    return "complete";
  }

  if (
    candidate.final_status === "cancelled"
  ) {
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

   BUSINESS RULE:

   New candidate
      ↓
   ACTIVE + HOLD
      ↓
   RECEIVED
      ↓
   Medical completed
      ↓
   PROCESSING

   Then validity controls HOLD automatically.
========================================================= */

export function calculateWorkflowState(
  input: WorkflowInput,
): CandidateWorkflowState {
  const mainStatus =
    getMainCandidateStatus(input);

  /* -------------------------------------------------------
     COMPLETE / RETURN / CANCEL
  ------------------------------------------------------- */

  if (mainStatus !== "active") {
    return {
      mainStatus,
      workflowState: "processing",
      currentStage:
        input.current_stage ?? null,
      holdReason: null,
    };
  }

  /* -------------------------------------------------------
     MEDICAL NOT STARTED
     
     No medical record/status means:
     
       ACTIVE
       + HOLD
       + RECEIVED
     
     This is the default state for a new candidate.
  ------------------------------------------------------- */

  if (
    !input.medicalStatus
  ) {
    return {
      mainStatus: "active",
      workflowState: "hold",
      currentStage:
        input.current_stage ?? null,
      holdReason: "received",
    };
  }

  /* -------------------------------------------------------
     MEDICAL PENDING

     If medical record exists but is still "new",
     candidate remains Received/Hold.
  ------------------------------------------------------- */

  if (
    input.medicalStatus === "new"
  ) {
    return {
      mainStatus: "active",
      workflowState: "hold",
      currentStage:
        input.current_stage ?? "medical",
      holdReason: "received",
    };
  }

  /* -------------------------------------------------------
     MEDICAL UNFIT

     This is a failed medical result.
     It should NOT be treated as Received.

     Keep it out of Processing.
     We use hold until a dedicated failure state exists.
  ------------------------------------------------------- */

  if (
    input.medicalStatus === "unfit"
  ) {
    return {
      mainStatus: "active",
      workflowState: "hold",
      currentStage:
        input.current_stage ?? "medical",
      holdReason: "manual_hold",
    };
  }

  /* -------------------------------------------------------
     MEDICAL FIT

     Medical is completed.

     Now validity starts.
  ------------------------------------------------------- */

  if (
    input.medicalStatus === "fit" &&
    input.medicalDate
  ) {
    if (
      isExpired(
        input.medicalDate,
        WORKFLOW_VALIDITY.medicalDays,
      )
    ) {
      return {
        mainStatus: "active",
        workflowState: "hold",
        currentStage:
          input.current_stage ?? "medical",
        holdReason: "medical_expired",
      };
    }
  }

  /* -------------------------------------------------------
     MOFA

     If MOFA is approved, its 30-day validity applies.
  ------------------------------------------------------- */

  if (
    input.mofaStage === "approved" &&
    input.mofaDate
  ) {
    if (
      isExpired(
        input.mofaDate,
        WORKFLOW_VALIDITY.mofaDays,
      )
    ) {
      return {
        mainStatus: "active",
        workflowState: "hold",
        currentStage:
          input.current_stage ?? "mofa",
        holdReason: "mofa_expired",
      };
    }
  }

  /* -------------------------------------------------------
     VISA

     Issued/approved visa:
       expiry_date is authoritative.

     If expiry_date is unavailable:
       visa_date + 90 days.
  ------------------------------------------------------- */

  if (
    input.visaStatus &&
    [
      "issued",
      "approved",
    ].includes(input.visaStatus)
  ) {
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

  /* -------------------------------------------------------
     IQAMA

     Flight departed
        +
     Iqama not completed
        +
     90 days passed
        =
     IQAMA OVERDUE
  ------------------------------------------------------- */

  if (
    input.flightStatus === "departed" &&
    input.flightDate &&
    input.iqamaCompleted !== true
  ) {
    if (
      isExpired(
        input.flightDate,
        WORKFLOW_VALIDITY.iqamaDays,
      )
    ) {
      return {
        mainStatus: "active",
        workflowState: "hold",
        currentStage:
          input.current_stage ?? "flight",
        holdReason: "iqama_overdue",
      };
    }
  }

  /* -------------------------------------------------------
     DEFAULT ACTIVE WORKING STATE

     If Medical is completed and no validity
     has expired, candidate is Processing.
  ------------------------------------------------------- */

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
     * Iqama is not yet fetched from a dedicated table
     * in the current implementation.
     */
    iqamaCompleted: false,
  });
}

/* =========================================================
   SYNC ONE CANDIDATE'S WORKFLOW STATE
   ---------------------------------------------------------
   Recalculates workflow_state/hold_reason from the
   candidate's current medical/mofa/visa/flight data and
   persists it.

   IMPORTANT:
   This is the missing "trigger point". calculateWorkflowState()
   and saveWorkflowState() already existed but nothing ever
   called them together. Call this after any save that can
   change a candidate's processing/hold state (medical, mofa,
   visa, flight create/update, and candidate reactivation).

   Callers should wrap this in try/catch and NOT let a sync
   failure block the actual save — same pattern already used
   for updateCandidateStage() in medical-service.ts.
========================================================= */

export async function syncCandidateWorkflowState(
  candidateId: string,
): Promise<void> {
  const state =
    await getCandidateWorkflow(candidateId);

  await saveWorkflowState(
    candidateId,
    state,
  );
}

/* =========================================================
   LIVE WORKFLOW STATES (BATCH, NON-PERSISTING)
   ---------------------------------------------------------
   Dashboard/candidate-list load হওয়ার সময় ব্যবহারের জন্য।

   getCandidateWorkflow() একটা candidate-এর জন্য ৫টা query
   করে — অনেকগুলো candidate-এর জন্য একসাথে সেটা করলে N+1
   হয়ে যাবে।

   এই ফাংশন medical/mofa/visa/flight-এর "candidate_id IN (...)"
   একটাই batch query করে, প্রতিটা candidate-এর latest record
   বের করে, তারপর calculateWorkflowState() দিয়ে হিসাব করে।

   IMPORTANT:
   এটা কিছুই DB-তে write করে না। শুধু display-এর জন্য
   real-time recalculation — যাতে কেউ কোনো record edit না
   করলেও (শুধু সময় পার হয়ে validity expire হয়ে গেলেও)
   dashboard/list-এ সঠিক Processing/Hold দেখা যায়।
========================================================= */

export interface WorkflowCandidateInput {
  id: string;
  current_stage: string | null;
  is_returned?: boolean | null;
  final_status?: string | null;
}

function latestRowsByCandidate<
  T extends { candidate_id: string },
>(
  rows: T[] | null | undefined,
): Map<string, T> {

  const map = new Map<string, T>();

  // rows আসে created_at descending order-এ,
  // তাই প্রতি candidate_id-র প্রথম row-টাই latest।
  for (const row of rows ?? []) {

    if (!map.has(row.candidate_id)) {
      map.set(row.candidate_id, row);
    }

  }

  return map;

}

export async function getLiveWorkflowStates(
  candidates: WorkflowCandidateInput[],
): Promise<Map<string, CandidateWorkflowState>> {

  const result =
    new Map<string, CandidateWorkflowState>();

  if (candidates.length === 0) {
    return result;
  }

  const candidateIds =
    candidates.map((c) => c.id);

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
      .in("candidate_id", candidateIds)
      .order("created_at", { ascending: false }),

    supabase
      .from("mofas")
      .select(
        "candidate_id, application_date, stage, created_at",
      )
      .in("candidate_id", candidateIds)
      .order("created_at", { ascending: false }),

    supabase
      .from("visas")
      .select(
        "candidate_id, visa_date, expiry_date, status, created_at",
      )
      .in("candidate_id", candidateIds)
      .order("created_at", { ascending: false }),

    supabase
      .from("flights")
      .select(
        "candidate_id, flight_date, status, created_at",
      )
      .in("candidate_id", candidateIds)
      .order("created_at", { ascending: false }),
  ]);

  if (medicalsResult.error) throw medicalsResult.error;
  if (mofasResult.error) throw mofasResult.error;
  if (visasResult.error) throw visasResult.error;
  if (flightsResult.error) throw flightsResult.error;

  const latestMedical =
    latestRowsByCandidate(
      medicalsResult.data as
        | ({ candidate_id: string } & Record<string, unknown>)[]
        | null,
    );

  const latestMofa =
    latestRowsByCandidate(
      mofasResult.data as
        | ({ candidate_id: string } & Record<string, unknown>)[]
        | null,
    );

  const latestVisa =
    latestRowsByCandidate(
      visasResult.data as
        | ({ candidate_id: string } & Record<string, unknown>)[]
        | null,
    );

  const latestFlight =
    latestRowsByCandidate(
      flightsResult.data as
        | ({ candidate_id: string } & Record<string, unknown>)[]
        | null,
    );

  for (const candidate of candidates) {

    const medical =
      latestMedical.get(candidate.id) as
        | {
            medical_date: string | null;
            fit_date: string | null;
            status: string | null;
          }
        | undefined;

    const mofa =
      latestMofa.get(candidate.id) as
        | {
            application_date: string | null;
            stage: string | null;
          }
        | undefined;

    const visa =
      latestVisa.get(candidate.id) as
        | {
            visa_date: string | null;
            expiry_date: string | null;
            status: string | null;
          }
        | undefined;

    const flight =
      latestFlight.get(candidate.id) as
        | {
            flight_date: string | null;
            status: string | null;
          }
        | undefined;

    const state =
      calculateWorkflowState({
        is_returned:
          candidate.is_returned ?? false,

        final_status:
          candidate.final_status ?? null,

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

        iqamaCompleted: false,
      });

    result.set(candidate.id, state);

  }

  return result;

}
