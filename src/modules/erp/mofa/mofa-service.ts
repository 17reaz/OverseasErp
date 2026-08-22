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
  agent: MofaCandidateAgent | null;
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
 *
 * IMPORTANT:
 * agencies table does NOT have country.
 * =========================================================
 */

export interface MofaAgency {
  id: string;
  tenant_id: string;
  sl: number | null;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  application_date: string;
  trade: string;

  stage: MofaStage;

  created_at: string;
  updated_at: string;

  candidate?: MofaCandidate | null;
  medical?: MofaMedical | null;
  agency?: MofaAgency | null;
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
 *
 * IMPORTANT:
 * agencies.country removed.
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
    phone,
    email,
    address,
    is_active,
    created_at,
    updated_at
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
  } = await supabase
    .from("mofas")
    .select(mofaSelect)
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  return {
    data: data as Mofa[] | null,
    error,
  };
}


/*
 * =========================================================
 * GET CANDIDATES
 *
 * Medical is optional.
 *
 * Candidate can have:
 *
 * Candidate
 *   ├── MOFA
 *   ├── Medical #1 → MOFA
 *   ├── Medical #2 → MOFA
 *   └── Medical #3 → MOFA
 *
 * =========================================================
 */

export async function getMofaCandidates() {
  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(candidateSelect)
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

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const candidates: MofaCandidate[] =
    (data ?? []).map(
      (candidate) => ({
        id: candidate.id,

        name: candidate.name,

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
            ? candidate.agent[0] ?? null
            : candidate.agent,
      }),
    );

  return {
    data: candidates,
    error: null,
  };
}


/*
 * =========================================================
 * GET MEDICALS FOR CANDIDATE
 *
 * Same candidate can have multiple medical records.
 * =========================================================
 */

export async function getCandidateMedicals(
  candidateId: string,
) {
  const {
    data,
    error,
  } = await supabase
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
        ascending: false,
      },
    );

  return {
    data: data as MofaMedical[] | null,
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
  } = await supabase
    .from("agencies")
    .select(`
      id,
      tenant_id,
      sl,
      name,
      code,
      phone,
      email,
      address,
      is_active,
      created_at,
      updated_at
    `)
    .eq(
      "is_active",
      true,
    )
    .order(
      "sl",
      {
        ascending: true,
      },
    );

  return {
    data: data as MofaAgency[] | null,
    error,
  };
}


/*
 * =========================================================
 * BACKWARD COMPATIBILITY
 *
 * Current mofa-form.tsx may import getAgencies().
 * Keep this alias so existing imports continue working.
 * =========================================================
 */

export async function getAgencies() {
  return getMofaAgencies();
}


/*
 * =========================================================
 * TENANT
 * =========================================================
 */

async function getCurrentTenantId() {
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

  if (!profile?.tenant_id) {
    throw new Error(
      "Tenant information is missing.",
    );
  }

  return profile.tenant_id;
}


/*
 * =========================================================
 * NORMALIZE INPUT
 *
 * Database requires:
 *
 * application_date NOT NULL
 * trade             NOT NULL
 *
 * =========================================================
 */

function normalizeMofaInput(
  input: MofaInput,
) {
  const applicationNumber =
    input.application_number.trim();

  if (!input.candidate_id) {
    throw new Error(
      "Candidate is required.",
    );
  }

  if (!applicationNumber) {
    throw new Error(
      "Application number is required.",
    );
  }

  const applicationDate =
    input.application_date?.trim() ||
    new Date()
      .toISOString()
      .slice(0, 10);

  const trade =
    input.trade?.trim() ||
    "Not Specified";

  /*
   * Medical is optional.
   *
   * If medical_id is null,
   * preserve the MOFA record but mark
   * it as invalid.
   */

  const stage: MofaStage =
    input.medical_id
      ? input.stage
      : "invalid";

  return {
    candidate_id:
      input.candidate_id,

    medical_id:
      input.medical_id || null,

    agency_id:
      input.agency_id || null,

    application_number:
      applicationNumber,

    application_date:
      applicationDate,

    trade,

    stage,
  };
}


/*
 * =========================================================
 * CREATE MOFA
 * =========================================================
 */

export async function createMofa(
  input: MofaInput,
) {
  try {
    const tenantId =
      await getCurrentTenantId();

    const values =
      normalizeMofaInput(
        input,
      );

    const {
      data,
      error,
    } = await supabase
      .from("mofas")
      .insert({
        /*
         * tenant_id:
         * explicitly supplied from authenticated profile.
         *
         * sl:
         * NOT supplied.
         *
         * Database trigger generates
         * tenant-wise serial automatically.
         */

        tenant_id:
          tenantId,

        candidate_id:
          values.candidate_id,

        medical_id:
          values.medical_id,

        agency_id:
          values.agency_id,

        application_number:
          values.application_number,

        application_date:
          values.application_date,

        trade:
          values.trade,

        stage:
          values.stage,
      })
      .select(mofaSelect)
      .single();

    return {
      data: data as Mofa | null,
      error,
    };
  } catch (error) {
    return {
      data: null,

      error:
        error instanceof Error
          ? error
          : new Error(
              "Failed to create MOFA.",
            ),
    };
  }
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
  try {
    if (!id) {
      throw new Error(
        "MOFA ID is required.",
      );
    }

    const values =
      normalizeMofaInput(
        input,
      );

    const {
      data,
      error,
    } = await supabase
      .from("mofas")
      .update({
        candidate_id:
          values.candidate_id,

        medical_id:
          values.medical_id,

        agency_id:
          values.agency_id,

        application_number:
          values.application_number,

        application_date:
          values.application_date,

        trade:
          values.trade,

        stage:
          values.stage,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id,
      )
      .select(mofaSelect)
      .single();

    return {
      data: data as Mofa | null,
      error,
    };
  } catch (error) {
    return {
      data: null,

      error:
        error instanceof Error
          ? error
          : new Error(
              "Failed to update MOFA.",
            ),
    };
  }
}


/*
 * =========================================================
 * DELETE MOFA
 * =========================================================
 */

export async function deleteMofa(
  id: string,
) {
  if (!id) {
    return {
      error: new Error(
        "MOFA ID is required.",
      ),
    };
  }

  const {
    error,
  } = await supabase
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