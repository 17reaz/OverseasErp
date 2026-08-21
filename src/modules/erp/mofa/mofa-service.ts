import { supabase } from "@/lib/supabase/client";

/*
 * =========================================================
 * MOFA STAGE
 * =========================================================
 */

export type MofaStage =
  | "new"
  | "medupdated"
  | "approved"
  | "canceled"
  | "expired"
  | "invalid";


/*
 * =========================================================
 * CANDIDATE
 * =========================================================
 */

export type MofaCandidateCountry =
  | "Saudi Arabia"
  | "Mauritius"
  | "Laos"
  | "Malaysia"
  | "Belarus"
  | null;


export interface MofaCandidateAgent {
  id: string;

  name: string | null;

  code: string | null;
}


export interface MofaCandidate {
  id: string;

  name: string;

  passport_no: string;

  received_date: string | null;

  country: MofaCandidateCountry;

  sl: number | null;

  agent_id: string | null;

  agent:
    MofaCandidateAgent | null;
}


/*
 * =========================================================
 * MEDICAL
 * =========================================================
 */

export type MofaMedicalStatus =
  | "new"
  | "fit"
  | "unfit"
  | "expired";


export interface MofaMedical {
  id: string;

  tenant_id: string;

  candidate_id: string;

  medical_date: string | null;

  fit_date: string | null;

  status: MofaMedicalStatus;

  created_at: string;

  updated_at: string;
}


/*
 * =========================================================
 * AGENCY
 * =========================================================
 */

export interface MofaAgency {
  id: string;

  tenant_id: string;

  sl: number | null;

  name: string;

  code: string | null;

  country: string | null;

  is_active: boolean;
}


/*
 * =========================================================
 * MOFA
 * =========================================================
 */

export interface Mofa {
  id: string;

  tenant_id: string;

  sl: number;

  candidate_id: string;

  medical_id: string | null;

  agency_id: string | null;

  application_number: string;

  application_date: string | null;

  trade: string | null;

  stage: MofaStage;

  created_at: string;

  updated_at: string;

  candidate?:
    MofaCandidate | null;

  medical?:
    MofaMedical | null;

  agency?:
    MofaAgency | null;
}


/*
 * =========================================================
 * INPUT
 * =========================================================
 */

export interface MofaInput {
  candidate_id: string;

  medical_id: string | null;

  agency_id: string | null;

  application_number: string;

  application_date: string | null;

  trade: string | null;

  stage: MofaStage;
}


/*
 * =========================================================
 * CANDIDATE SELECT
 * =========================================================
 */

const candidateSelect = `
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
`;


/*
 * =========================================================
 * MOFA SELECT
 * =========================================================
 */

const mofaSelect = `
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
  ),
  medical:medicals (
    id,
    tenant_id,
    candidate_id,
    medical_date,
    fit_date,
    status,
    created_at,
    updated_at
  ),
  agency:agencies (
    id,
    tenant_id,
    sl,
    name,
    code,
    country,
    is_active
  )
`;


/*
 * =========================================================
 * GET MOFAS
 * =========================================================
 */

export async function getMofas() {

  const {
    data,
    error,
  } =
    await supabase
      .from("mofas")
      .select(
        mofaSelect,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  return {
    data:
      data as
        Mofa[] |
        null,

    error,
  };
}


/*
 * =========================================================
 * GET CANDIDATES
 *
 * Candidate can have:
 *
 * 1. Medical
 * 2. Multiple Medical
 * 3. No Medical
 *
 * So we DO NOT filter candidates by medical here.
 *
 * Candidate selection is independent.
 * Medical selection happens after candidate selection.
 * =========================================================
 */

export async function getMofaCandidates() {

  const {
    data,
    error,
  } =
    await supabase
      .from("candidates")
      .select(
        candidateSelect,
      )
      .eq(
        "is_deleted",
        false,
      )
      .order(
        "sl",
        {
          ascending:
            false,
        },
      );


  if (error) {

    return {
      data:
        null,

      error,
    };

  }


  const candidates:
    MofaCandidate[] =
    (data ?? []).map(
      (
        candidate,
      ) => ({

        id:
          candidate.id,

        name:
          candidate.name,

        passport_no:
          candidate.passport_no,

        received_date:
          candidate.received_date,

        country:
          candidate.country,

        sl:
          candidate.sl,

        agent_id:
          candidate.agent_id,

        agent:
          Array.isArray(
            candidate.agent,
          )
            ? candidate.agent[0] ??
              null
            : candidate.agent,

      }),
    );


  return {
    data:
      candidates,

    error:
      null,
  };
}


/*
 * =========================================================
 * GET MEDICALS FOR CANDIDATE
 *
 * IMPORTANT:
 *
 * Same candidate may have multiple medical records.
 *
 * Therefore:
 *
 * candidate_id
 *      ↓
 * medical #1
 * medical #2
 * medical #3
 *
 * =========================================================
 */

export async function getCandidateMedicals(
  candidateId: string,
) {

  const {
    data,
    error,
  } =
    await supabase
      .from("medicals")
      .select(`
        id,
        tenant_id,
        candidate_id,
        medical_date,
        fit_date,
        status,
        created_at,
        updated_at
      `)
      .eq(
        "candidate_id",
        candidateId,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  return {
    data:
      data as
        MofaMedical[] |
        null,

    error,
  };
}


/*
 * =========================================================
 * GET AGENCIES
 * =========================================================
 */

export async function getMofaAgencies() {

  const {
    data,
    error,
  } =
    await supabase
      .from("agencies")
      .select(`
        id,
        tenant_id,
        sl,
        name,
        code,
        country,
        is_active
      `)
      .eq(
        "is_active",
        true,
      )
      .order(
        "sl",
        {
          ascending:
            true,
        },
      );


  return {
    data:
      data as
        MofaAgency[] |
        null,

    error,
  };
}


/*
 * =========================================================
 * CREATE MOFA
 * =========================================================
 *
 * medical_id CAN be NULL.
 *
 * Example:
 *
 * Candidate
 *    ↓
 * MOFA
 *    ↓
 * medical_id = NULL
 *    ↓
 * stage = invalid
 *
 * This keeps the historical/dead MOFA record.
 * =========================================================
 */

export async function createMofa(
  input: MofaInput,
) {

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth.getUser();


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
    error:
      profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "tenant_id",
      )
      .eq(
        "id",
        user.id,
      )
      .single();


  if (profileError) {
    throw profileError;
  }


  if (
    !profile?.tenant_id
  ) {

    throw new Error(
      "Tenant information is missing.",
    );

  }


  /*
   * If no medical is linked,
   * the record should be invalid.
   *
   * This prevents an accidental
   * "valid" MOFA without medical.
   */

  const stage =
    input.medical_id
      ? input.stage
      : "invalid";


  const {
    data,
    error,
  } =
    await supabase
      .from("mofas")
      .insert({

        tenant_id:
          profile.tenant_id,

        candidate_id:
          input.candidate_id,

        medical_id:
          input.medical_id ||
          null,

        agency_id:
          input.agency_id ||
          null,

        application_number:
          input.application_number,

        application_date:
          input.application_date ||
          null,

        trade:
          input.trade ||
          null,

        stage,

      })
      .select(
        mofaSelect,
      )
      .single();


  return {
    data:
      data as
        Mofa |
        null,

    error,
  };
}


/*
 * =========================================================
 * UPDATE MOFA
 * =========================================================
 */

export async function updateMofa(
  id: string,
  input: MofaInput,
) {

  const stage =
    input.medical_id
      ? input.stage
      : "invalid";


  const {
    data,
    error,
  } =
    await supabase
      .from("mofas")
      .update({

        candidate_id:
          input.candidate_id,

        medical_id:
          input.medical_id ||
          null,

        agency_id:
          input.agency_id ||
          null,

        application_number:
          input.application_number,

        application_date:
          input.application_date ||
          null,

        trade:
          input.trade ||
          null,

        stage,

        updated_at:
          new Date().toISOString(),

      })
      .eq(
        "id",
        id,
      )
      .select(
        mofaSelect,
      )
      .single();


  return {
    data:
      data as
        Mofa |
        null,

    error,
  };
}


/*
 * =========================================================
 * DELETE MOFA
 * =========================================================
 */

export async function deleteMofa(
  id: string,
) {

  const {
    error,
  } =
    await supabase
      .from("mofas")
      .delete()
      .eq(
        "id",
        id,
      );


  return {
    error,
  };
}