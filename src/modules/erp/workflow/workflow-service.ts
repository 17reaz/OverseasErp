import { supabase } from "@/lib/supabase/client";

import type {
  CandidateWorkflowState,
  HoldReason,
  MainCandidateStatus,
  WorkflowState,
} from "./workflow-types";

/* =========================================================
   VALIDITY RULES

   Business rules supplied for OverseasErp:
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
   MAIN STATUS
   ---------------------------------------------------------
   Keep existing database model.

   is_returned = return
   final_status = complete
   final_status = cancelled
   otherwise = active
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
   WORKFLOW RESULT
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
   CALCULATE WORKFLOW

   IMPORTANT:
   This function does NOT change current_stage.

   HOLD is a state, NOT a stage.
========================================================= */

export function calculateWorkflowState(
  input: WorkflowInput,
): CandidateWorkflowState {
  const mainStatus =
    getMainCandidateStatus(input);

  /* -------------------------------------------------------
     Frozen candidates
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
     MEDICAL
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
  ------------------------------------------------------- */

  if (
    input.visaStatus &&
    ["issued", "approved"].includes(
      input.visaStatus,
    )
  ) {
    /*
     * If database already has expiry_date,
     * use that as authoritative.
     */
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
    }

    /*
     * Fallback:
     * visa_date + 90 days
     */
    else if (input.visaDate) {
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
     DEFAULT
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
   PERSIST WORKFLOW STATE
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

   Uses existing module tables.
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

  const state =
    calculateWorkflowState({
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
    });

  return state;
}