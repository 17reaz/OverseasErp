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
 * Approved MOFAs that:
 *
 *   - do NOT have a visa yet
 *   - have a completed fingerprint record
 *   - have a verified police clearance
 *
 * Same pattern as getFitMedicalsWithoutMofa()
 * in mofa-service.ts.
 * =========================================================
 */

export interface VisaEligibleAgent {
  id: string;
  name: string | null;
  code: string | null;
}

export interface VisaEligibleCandidate {
  id: string;
  name: string;
  passport_no: string;
  received_date: string | null;
  country: string | null;
  sl: number | null;
  agent_id: string | null;
  agent: VisaEligibleAgent | null;
}

export interface VisaEligibleMofa {
  id: string;

  application_number: string;

  application_date: string | null;

  trade: string | null;

  candidate_id: string;

  candidate: VisaEligibleCandidate;
}

export async function getApprovedMofasWithoutVisa() {
  /*
   * 1. Approved MOFAs + candidate
   */

  const {
    data: mofas,
    error: mofasError,
  } = await supabase
    .from("mofas")
    .select(`
      id,
      application_number,
      application_date,
      trade,
      candidate_id,
      stage,
      candidate:candidates (
        id,
        name,
        passport_no,
        received_date,
        country,
        sl,
        agent_id,
        agent:agents (
          id,
          name,
          code
        )
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
   */

  const pending: VisaEligibleMofa[] =
    (mofas ?? [])
      .filter(
        (mofa) =>
          !visaMofaIds.has(
            mofa.id,
          ) &&
          fingerCompletedCandidateIds.has(
            mofa.candidate_id,
          ) &&
          verifiedPoliceClearanceCandidateIds.has(
            mofa.candidate_id,
          ),
      )
      .map((mofa) => {

        const rawCandidate =
          Array.isArray(mofa.candidate)
            ? mofa.candidate[0]
            : mofa.candidate;

        return {
          id: mofa.id,
          application_number: mofa.application_number,
          application_date: mofa.application_date,
          trade: mofa.trade,
          candidate_id: mofa.candidate_id,
          candidate: {
            id: rawCandidate.id,
            name: rawCandidate.name,
            passport_no: rawCandidate.passport_no,
            received_date: rawCandidate.received_date,
            country: rawCandidate.country,
            sl: rawCandidate.sl,
            agent_id: rawCandidate.agent_id,
            agent: Array.isArray(rawCandidate.agent)
              ? rawCandidate.agent[0] ?? null
              : rawCandidate.agent,
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