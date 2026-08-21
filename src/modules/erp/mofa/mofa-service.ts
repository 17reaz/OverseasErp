import {
  supabase,
} from "@/lib/supabase/client";


export type MofaStage =
  | "new"
  | "medupdated"
  | "approved"
  | "canceled"
  | "expired"
  | "invalid";

  
export interface MofaCandidate {
  id: string;
  sl: number | null;
  name: string;
  passport_no: string;
  country: string | null;
  received_date: string | null;

  agency: {
    id: string;
    name: string;
    code: string | null;
  } | null;
}


export interface MofaMedical {
  id: string;
  candidate_id: string;
  medical_date: string | null;
  fit_date: string | null;
  status: string;
}


export interface Mofa {
  id: string;

  tenant_id: string;

  sl: number;

  candidate_id: string;

  medical_id: string | null;

  application_number: string;

  application_date: string;

  trade: string;

  agency_id: string | null;

  stage: MofaStage;

  created_at: string;

  updated_at: string;

  candidate: {
    id: string;
    name: string;
    passport_no: string;
    country: string | null;
  } | null;

  medical: {
    id: string;
    medical_date: string | null;
    fit_date: string | null;
    status: string;
  } | null;

  agency: {
    id: string;
    name: string;
    code: string | null;
  } | null;
}


export interface MofaInput {
  candidate_id: string;

  medical_id?: string | null;

  application_number: string;

  application_date: string;

  trade: string;

  agency_id?: string | null;

  stage: MofaStage;
}


/*
 * =========================================================
 * GET MOFA RECORDS
 * =========================================================
 */

export async function getMofas() {

  return supabase
    .from("mofas")
    .select(`
      id,
      tenant_id,
      sl,
      candidate_id,
      medical_id,
      application_number,
      application_date,
      trade,
      agency_id,
      stage,
      created_at,
      updated_at,

      candidate:candidates (
        id,
        name,
        passport_no,
        country
      ),

      medical:medicals (
        id,
        medical_date,
        fit_date,
        status
      ),

      agency:agencies (
        id,
        name,
        code
      )
    `)
    .order(
      "sl",
      {
        ascending: true,
      },
    );
}


/*
 * =========================================================
 * GET CANDIDATES FOR MOFA
 *
 * Candidate can create MOFA even without Medical.
 * =========================================================
 */

export async function getCandidatesForMofa() {

  return supabase
    .from("candidates")
    .select(`
      id,
      sl,
      name,
      passport_no,
      country,
      received_date,

      agency:agents (
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
        ascending: true,
      },
    );
}


/*
 * =========================================================
 * GET MEDICALS FOR CANDIDATE
 *
 * One Medical can be used by many MOFA records.
 * =========================================================
 */

export async function getCandidateMedicals(
  candidateId: string,
) {

  return supabase
    .from("medicals")
    .select(`
      id,
      candidate_id,
      medical_date,
      fit_date,
      status
    `)
    .eq(
      "candidate_id",
      candidateId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );
}


/*
 * =========================================================
 * GET AGENCIES
 * =========================================================
 */

export async function getAgencies() {

  return supabase
    .from("agencies")
    .select(`
      id,
      name,
      code
    `)
    .eq(
      "is_active",
      true,
    )
    .order(
      "name",
      {
        ascending: true,
      },
    );
}


/*
 * =========================================================
 * CREATE MOFA
 * =========================================================
 */

export async function createMofa(
  tenantId: string,
  input: MofaInput,
) {

  return supabase
    .from("mofas")
    .insert({
      tenant_id:
        tenantId,

      candidate_id:
        input.candidate_id,

      medical_id:
        input.medical_id ??
        null,

      application_number:
        input.application_number,

      application_date:
        input.application_date,

      trade:
        input.trade,

      agency_id:
        input.agency_id ??
        null,

      stage:
        input.stage,
    })
    .select(`
      id,
      tenant_id,
      sl,
      candidate_id,
      medical_id,
      application_number,
      application_date,
      trade,
      agency_id,
      stage,
      created_at,
      updated_at,

      candidate:candidates (
        id,
        name,
        passport_no,
        country
      ),

      medical:medicals (
        id,
        medical_date,
        fit_date,
        status
      ),

      agency:agencies (
        id,
        name,
        code
      )
    `)
    .single();
}


/*
 * =========================================================
 * UPDATE MOFA
 * =========================================================
 */

export async function updateMofa(
  id: string,
  input: Partial<MofaInput>,
) {

  return supabase
    .from("mofas")
    .update({
      ...input,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      id,
    )
    .select(`
      id,
      tenant_id,
      sl,
      candidate_id,
      medical_id,
      application_number,
      application_date,
      trade,
      agency_id,
      stage,
      created_at,
      updated_at,

      candidate:candidates (
        id,
        name,
        passport_no,
        country
      ),

      medical:medicals (
        id,
        medical_date,
        fit_date,
        status
      ),

      agency:agencies (
        id,
        name,
        code
      )
    `)
    .single();
}


/*
 * =========================================================
 * DELETE MOFA
 * =========================================================
 */

export async function deleteMofa(
  id: string,
) {

  return supabase
    .from("mofas")
    .delete()
    .eq(
      "id",
      id,
    );
}