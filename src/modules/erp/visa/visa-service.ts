import { supabase } from "@/lib/supabase/client";
import { updateCandidateStage } from "../candidates/candidate-service";

import { syncCandidateWorkflowState } from "../workflow/workflow-service";

export interface Visa {
  id: string;
  tenant_id: string;
  candidate_id: string;
  mofa_id: string | null;
  sl: number;
  visa_no?: string | null;
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
  visa_no?: string | null;
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
  // Unique row key; medical ID ব্যবহার করা যাবে যদি MOFA না থাকে
  id: string;

  candidate_id: string;
  medical_id: string;
  mofa_id: string | null;

  application_number: string | null;
  fit_date: string | null;
  medical_valid: boolean;

  finger_completed: boolean;
  police_clearance_verified: boolean;
  takamul_completed: boolean;

  candidate: VisaEligibleCandidate;
}

export async function getApprovedMofasWithoutVisa() {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Fit medical records that are marked active
  

  // Keep the date filter below separate: a fit date in the past
  // may still be valid, depending on the configured validity period.
  const { data: allActiveMedicals, error: activeMedicalError } =
    await supabase
      .from("medicals")
      .select(`
        id,
        candidate_id,
        fit_date,
        status,
        validity_status,
        version
      `)
      .eq("status", "fit")
      .eq("validity_status", "active");

  if (activeMedicalError) {
    return { data: null, error: activeMedicalError };
  }

  const validMedicals = (allActiveMedicals ?? []).filter((medical) => {
    if (!medical.fit_date || medical.fit_date > today) {
      return false;
    }

    return true;
  });

  // 2. Candidate information
  const candidateIds = [
    ...new Set(validMedicals.map((medical) => medical.candidate_id)),
  ];

  if (candidateIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: candidates, error: candidateError } = await supabase
    .from("candidates")
    .select("id, name, passport_no, sl")
    .in("id", candidateIds)
    .eq("is_deleted", false);

  if (candidateError) {
    return { data: null, error: candidateError };
  }

  const candidateMap = new Map(
    (candidates ?? []).map((candidate) => [candidate.id, candidate]),
  );

  // 3. MOFA records; candidates without MOFA are included too.
  const { data: mofas, error: mofaError } = await supabase
    .from("mofas")
    .select(`
      id,
      candidate_id,
      medical_id,
      application_number,
      stage,
      validity_status,
      version
    `)
    .in("candidate_id", candidateIds)
    .eq("stage", "approved")
    .eq("validity_status", "active");

  if (mofaError) {
    return { data: null, error: mofaError };
  }

  const { data: visas, error: visaError } = await supabase
    .from("visas")
    .select("candidate_id, mofa_id");

  if (visaError) {
    return { data: null, error: visaError };
  }

  const candidatesWithVisa = new Set(
    (visas ?? []).map((visa) => visa.candidate_id),
  );

  const visaMofaIds = new Set(
    (visas ?? [])
      .map((visa) => visa.mofa_id)
      .filter((id): id is string => Boolean(id)),
  );

  // 4. Current completed finger records
  const { data: fingers, error: fingerError } = await supabase
    .from("fingers")
    .select("candidate_id")
    .eq("status", "completed")
    .eq("is_current", true);

  if (fingerError) {
    return { data: null, error: fingerError };
  }

  const fingerCandidateIds = new Set(
    (fingers ?? []).map((finger) => finger.candidate_id),
  );

  // 5. Verified Police Clearance
  const { data: policeClearances, error: pcError } = await supabase
    .from("police_clearances")
    .select("candidate_id")
    .eq("verified", true);

  if (pcError) {
    return { data: null, error: pcError };
  }

  const pcCandidateIds = new Set(
    (policeClearances ?? []).map((pc) => pc.candidate_id),
  );

  // 6. Completed Takamul / trade tests
  const { data: tradeTests, error: takamulError } = await supabase
    .from("trade_tests")
    .select("candidate_id")
    .eq("status", "completed");

  if (takamulError) {
    return { data: null, error: takamulError };
  }

  const takamulCandidateIds = new Set(
    (tradeTests ?? []).map((test) => test.candidate_id),
  );

  // 7. Pick the newest approved MOFA for each candidate.
  // A medical without an approved MOFA remains eligible.
  const mofaByCandidate = new Map<string, (typeof mofas)[number]>();

  for (const mofa of mofas ?? []) {
    if (visaMofaIds.has(mofa.id)) continue;

    const existing = mofaByCandidate.get(mofa.candidate_id);

    if (!existing || (mofa.version ?? 1) > (existing.version ?? 1)) {
      mofaByCandidate.set(mofa.candidate_id, mofa);
    }
  }

  const result: VisaEligibleMofa[] = [];

  for (const medical of validMedicals) {
    const candidate = candidateMap.get(medical.candidate_id);

    if (!candidate) continue;

    // No Visa for this candidate
    if (candidatesWithVisa.has(candidate.id)) continue;

    const mofa = mofaByCandidate.get(candidate.id);

    // If an approved MOFA exists, it must belong to this medical.
    // Otherwise the candidate may still appear without a MOFA.
    if (mofa && mofa.medical_id && mofa.medical_id !== medical.id) {
      continue;
    }

    result.push({
      id: mofa?.id ?? medical.id,
      candidate_id: candidate.id,
      medical_id: medical.id,
      mofa_id: mofa?.id ?? null,
      application_number: mofa?.application_number ?? null,
      fit_date: medical.fit_date,
      medical_valid: true,
      finger_completed: fingerCandidateIds.has(candidate.id),
      police_clearance_verified: pcCandidateIds.has(candidate.id),
      takamul_completed: takamulCandidateIds.has(candidate.id),
      candidate: {
        id: candidate.id,
        name: candidate.name,
        passport_no: candidate.passport_no,
        sl: candidate.sl,
      },
    });
  }

  return { data: result, error: null };
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