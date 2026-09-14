import { supabase } from "@/lib/supabase/client";
import { updateCandidateStage } from "../candidates/candidate-service";

import { syncCandidateWorkflowState } from "../workflow/workflow-service";

export interface Visa {
  id: string;
  tenant_id: string;
  candidate_id: string;
  mofa_id: string | null;
  sl: number;
  visa_no: string;
  visa_date: string | null;
  expiry_date: string | null;
  visa_type: string;
  status: string;
  agency_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export type VisaInput = {
  candidate_id: string;
  mofa_id?: string | null;
  visa_no: string;
  visa_date?: string | null;
  expiry_date?: string | null;
  visa_type?: string;
  status?: string;
  agency_id?: string | null;
  remarks?: string | null;
    advance_stage?: boolean;
};

export async function getVisas(): Promise<Visa[]> {
  const { data, error } = await supabase
    .from("visas")
    .select("*")
    .order("sl", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}


/*
 * =========================================================
 * VISAABLE
 *
 * Approved MOFAs that don't have a visa yet.
 *
 * Finger + Police Clearance status are attached as
 * booleans (not filtered on) so the office can see
 * readiness at a glance and decide when to proceed.
 *
 * Same pattern as getFitMedicalsWithoutMofa()
 * in mofa-service.ts.
 * =========================================================
 */

export interface VisaEligibleCandidate {
  id: string;
  name: string;
  passport_no: string;
  sl: number | null;
}

export interface VisaEligibleMofa {
  id: string;

  application_number: string;

  fit_date: string | null;

  finger_completed: boolean;

  police_clearance_verified: boolean;

  candidate_id: string;

  candidate: VisaEligibleCandidate;
}

export async function getApprovedMofasWithoutVisa() {
  /*
   * 1. Approved MOFAs + candidate + fit date
   *    (fit date comes from the linked medical)
   */

  const {
    data: mofas,
    error: mofasError,
  } = await supabase
    .from("mofas")
    .select(`
      id,
      application_number,
      candidate_id,
      stage,
      candidate:candidates (
        id,
        name,
        passport_no,
        sl
      ),
      medical:medicals (
        fit_date
      )
    `)
    .eq(
      "stage",
      "approved",
    )
    .order(
      "application_date",
      {
        ascending: false,
      },
    );

  if (mofasError) {
    return {
      data: null,
      error: mofasError,
    };
  }


  /*
   * 2. MOFAs that already have a visa
   */

  const {
    data: visas,
    error: visasError,
  } = await supabase
    .from("visas")
    .select(
      "mofa_id",
    );

  if (visasError) {
    return {
      data: null,
      error: visasError,
    };
  }

  const visaMofaIds =
    new Set(
      (visas ?? [])
        .map(
          (visa) =>
            visa.mofa_id,
        )
        .filter(Boolean),
    );


  /*
   * 3. Candidates with a completed
   *    fingerprint record
   */

  const {
    data: fingers,
    error: fingersError,
  } = await supabase
    .from("fingers")
    .select(
      "candidate_id",
    )
    .eq(
      "status",
      "completed",
    );

  if (fingersError) {
    return {
      data: null,
      error: fingersError,
    };
  }

  const fingerCompletedCandidateIds =
    new Set(
      (fingers ?? []).map(
        (finger) =>
          finger.candidate_id,
      ),
    );


  /*
   * 4. Candidates with a verified
   *    police clearance
   */

  const {
    data: policeClearances,
    error: policeClearancesError,
  } = await supabase
    .from("police_clearances")
    .select(
      "candidate_id",
    )
    .eq(
      "verified",
      true,
    );

  if (policeClearancesError) {
    return {
      data: null,
      error: policeClearancesError,
    };
  }

  const verifiedPoliceClearanceCandidateIds =
    new Set(
      (policeClearances ?? []).map(
        (clearance) =>
          clearance.candidate_id,
      ),
    );


  /*
   * 5. Combine
   *
   * Only gate on "no visa yet" — finger
   * and police clearance are shown as
   * booleans, not filtered on.
   */

  const pending: VisaEligibleMofa[] =
    (mofas ?? [])
      .filter(
        (mofa) =>
          !visaMofaIds.has(
            mofa.id,
          ),
      )
      .map((mofa) => {

        const rawCandidate =
          Array.isArray(mofa.candidate)
            ? mofa.candidate[0]
            : mofa.candidate;

        const rawMedical =
          Array.isArray(mofa.medical)
            ? mofa.medical[0]
            : mofa.medical;

        return {
          id: mofa.id,
          application_number: mofa.application_number,
          fit_date: rawMedical?.fit_date ?? null,
          finger_completed:
            fingerCompletedCandidateIds.has(
              mofa.candidate_id,
            ),
          police_clearance_verified:
            verifiedPoliceClearanceCandidateIds.has(
              mofa.candidate_id,
            ),
          candidate_id: mofa.candidate_id,
          candidate: {
            id: rawCandidate.id,
            name: rawCandidate.name,
            passport_no: rawCandidate.passport_no,
            sl: rawCandidate.sl,
          },
        };

      });


  return {
    data: pending,
    error: null,
  };
}

export async function createVisa(input: VisaInput): Promise<Visa> {
  const {
    advance_stage,
    ...visaData
  } = input;

  const { data, error } = await supabase
    .from("visas")
    .insert([visaData])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (advance_stage !== false) {
    try {
      await updateCandidateStage(
        data.candidate_id,
        "visa",
      );
    } catch (stageError) {
      console.error(
        "Failed to auto-advance candidate stage to visa:",
        stageError,
      );
    }
  }

  try {
    await syncCandidateWorkflowState(
      data.candidate_id,
    );
  } catch (workflowError) {
    console.error(
      "Failed to sync candidate workflow state after visa create:",
      workflowError,
    );
  }

  return data;
}

export async function updateVisa(
  id: string,
  input: Partial<VisaInput>,
): Promise<Visa> {
  const { data, error } = await supabase
    .from("visas")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await syncCandidateWorkflowState(data.candidate_id);
  } catch (workflowError) {
    console.error(
      "Failed to sync candidate workflow state after visa update:",
      workflowError,
    );
  }

  return data;
}

export async function deleteVisa(id: string): Promise<void> {
  const { error } = await supabase
    .from("visas")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}