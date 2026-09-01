import { supabase } from "@/lib/supabase/client";
import { updateCandidateStage } from "../candidates/candidate-service";

export type MedicalStatus =
  | "new"
  | "fit"
  | "unfit"
  | "expired";


export type MedicalCandidateCountry =
  | "Saudi Arabia"
  | "Mauritius"
  | "Laos"
  | "Malaysia"
  | "Belarus"
  | null;


export interface MedicalCandidateAgent {
  id: string;
  name: string | null;
  code: string | null;
}


export interface MedicalCandidate {
  id: string;

  name: string;

  passport_no: string;

  received_date: string | null;

  country:
    MedicalCandidateCountry;

  sl: number | null;

  agent_id: string | null;

  agent:
    MedicalCandidateAgent | null;
}


export interface Medical {
  id: string;

  tenant_id: string;

  candidate_id: string;

  medical_date:
    string | null;

  fit_date:
    string | null;

  status:
    MedicalStatus;

  created_at: string;

  updated_at: string;

  candidate?:
    MedicalCandidate | null;
}


export interface MedicalInput {
  candidate_id: string;

  medical_date:
    string | null;

  fit_date:
    string | null;

  status:
    MedicalStatus;
    advance_stage?: boolean;

}


/*
 * =========================================================
 * GET MEDICALS
 * =========================================================
 */

export async function getMedicals() {

  const {
    data,
    error,
  } = await supabase
    .from("medicals")
    .select(`
      *,
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
    .order(
      "created_at",
      {
        ascending: false,
      },
    );


  return {
    data:
      data as Medical[] | null,

    error,
  };
}


/*
 * =========================================================
 * CREATE MEDICAL
 * =========================================================
 */

export async function createMedical(
  input: MedicalInput,
) {

  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();


  if (userError) {
    throw userError;
  }


  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }


  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq(
      "id",
      user.id,
    )
    .single();


  if (profileError) {
    throw profileError;
  }


  if (!profile?.tenant_id) {
    throw new Error(
      "Tenant information is missing.",
    );
  }


  const {
    data,
    error,
  } = await supabase
    .from("medicals")
    .insert({
      tenant_id:
        profile.tenant_id,

      candidate_id:
        input.candidate_id,

      medical_date:
        input.medical_date ||
        null,

      fit_date:
        input.status === "fit"
          ? input.fit_date ||
            null
          : null,

      status:
        input.status,
    })
    .select(`
      *,
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
    .single();
    // createMedical() এর ভিতরে — auto-advance ব্লকের condition বদলেছে
if (!error && data && input.advance_stage !== false) {

  try {

    await updateCandidateStage(
      input.candidate_id,
      "medical",
    );

  } catch (stageError) {

    console.error(
      "Failed to auto-advance candidate stage to medical:",
      stageError,
    );

  }

}


  return {
    data:
      data as Medical | null,

    error,
  };
}


/*
 * =========================================================
 * UPDATE MEDICAL
 * =========================================================
 */

export async function updateMedical(
  id: string,
  input: MedicalInput,
) {

  const {
    data,
    error,
  } = await supabase
    .from("medicals")
    .update({
      candidate_id:
        input.candidate_id,

      medical_date:
        input.medical_date ||
        null,

      fit_date:
        input.status === "fit"
          ? input.fit_date ||
            null
          : null,

      status:
        input.status,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      id,
    )
    .select(`
      *,
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
    .single();


  return {
    data:
      data as Medical | null,

    error,
  };
}


/*
 * =========================================================
 * DELETE MEDICAL
 * =========================================================
 */

export async function deleteMedical(
  id: string,
) {

  const {
    error,
  } = await supabase
    .from("medicals")
    .delete()
    .eq(
      "id",
      id,
    );


  return {
    error,
  };
}


/*
 * =========================================================
 * GET CANDIDATES WITHOUT MEDICAL
 * =========================================================
 */

export async function getCandidatesWithoutMedical() {

  const {
    data: candidates,
    error: candidatesError,
  } = await supabase
    .from("candidates")
    .select(`
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
    `)
    .eq(
      "is_deleted",
      false,
    )
    .order(
      "sl",
      {
        ascending: false,
      },
    );


  if (candidatesError) {

    return {
      data: null,
      error: candidatesError,
    };

  }


  const {
    data: medicals,
    error: medicalError,
  } = await supabase
    .from("medicals")
    .select(
      "candidate_id",
    );


  if (medicalError) {

    return {
      data: null,
      error: medicalError,
    };

  }


  const medicalCandidateIds =
    new Set(
      (medicals ?? []).map(
        (item) =>
          item.candidate_id,
      ),
    );


  const pending: MedicalCandidate[] =
  (candidates ?? [])
    .filter(
      (candidate) =>
        !medicalCandidateIds.has(
          candidate.id,
        ),
    )
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      passport_no: candidate.passport_no,
      received_date: candidate.received_date,
      country: candidate.country,
      sl: candidate.sl,
      agent_id: candidate.agent_id,
      agent: Array.isArray(candidate.agent)
        ? candidate.agent[0] ?? null
        : candidate.agent,
    }));

return {
  data: pending,
  error: null,
};
}