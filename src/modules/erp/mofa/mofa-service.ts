import { supabase } from "@/lib/supabase/client";
import { syncCandidateWorkflowState } from "../workflow/workflow-service";

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
 * VISA
 *
 * Relation:
 *
 * visas.mofa_id -> mofas.id
 *
 * We intentionally load visas separately instead of
 * relying on a nested Supabase relation.
 * =========================================================
 */

export interface MofaVisa {
  id: string;
  candidate_id: string;
  mofa_id: string | null;
  visa_no: string | null;
  visa_date: string | null;
  expiry_date: string | null;
  visa_type: string | null;
  status: string | null;
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

  /*
   * Visa relation is loaded separately.
   *
   * One MOFA may have zero or more visa records.
   */
  visas?: MofaVisa[];
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
 * Visa is intentionally NOT nested here.
 *
 * Visa relation is loaded separately through mofa_id.
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
 * VISA SELECT
 * =========================================================
 */

const visaSelect = `
  id,
  candidate_id,
  mofa_id,
  visa_no,
  visa_date,
  expiry_date,
  visa_type,
  status,
  created_at,
  updated_at
`;


/*
 * =========================================================
 * ATTACH VISAS
 *
 * Relation:
 *
 * visas.mofa_id = mofas.id
 *
 * This keeps the main MOFA query simple and avoids
 * depending on Supabase's nested relation shape.
 * =========================================================
 */

async function attachMofaVisas(
  mofas: Mofa[],
) {
  if (mofas.length === 0) {
    return mofas;
  }

  const mofaIds = mofas.map(
    (mofa) => mofa.id,
  );

  const {
    data: visas,
    error,
  } = await supabase
    .from("visas")
    .select(visaSelect)
    .in(
      "mofa_id",
      mofaIds,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw error;
  }

  const visasByMofa =
    new Map<string, MofaVisa[]>();

  for (const visa of (visas ?? []) as MofaVisa[]) {
    if (!visa.mofa_id) {
      continue;
    }

    const existing =
      visasByMofa.get(
        visa.mofa_id,
      ) ?? [];

    existing.push(visa);

    visasByMofa.set(
      visa.mofa_id,
      existing,
    );
  }

  return mofas.map(
    (mofa) => ({
      ...mofa,

      visas:
        visasByMofa.get(
          mofa.id,
        ) ?? [],
    }),
  );
}


/*
 * =========================================================
 * GET MOFAS
 * =========================================================
 */

export async function getMofas() {
  try {
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

    if (error) {
      return {
        data: null,
        error,
      };
    }

    const mofas =
      (data ?? []) as Mofa[];

    const mofasWithVisas =
      await attachMofaVisas(
        mofas,
      );

    return {
      data: mofasWithVisas,
      error: null,
    };
  } catch (error) {
    return {
      data: null,

      error:
        error instanceof Error
          ? error
          : new Error(
              "Failed to load MOFA records.",
            ),
    };
  }
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
 * MOFAABLE
 *
 * Fit medicals that do NOT have a MOFA yet.
 * =========================================================
 */

export interface MofaPendingMedical {
  id: string;

  medical_date: string | null;

  fit_date: string | null;

  status: MofaMedicalStatus;

  candidate: MofaCandidate;
}


export async function getFitMedicalsWithoutMofa() {
  const {
    data: medicals,
    error: medicalsError,
  } = await supabase
    .from("medicals")
    .select(`
      id,
      medical_date,
      fit_date,
      status,
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
      "status",
      "fit",
    )
    .order(
      "fit_date",
      {
        ascending: false,
      },
    );

  if (medicalsError) {
    return {
      data: null,
      error: medicalsError,
    };
  }

  const {
    data: mofas,
    error: mofasError,
  } = await supabase
    .from("mofas")
    .select("medical_id");

  if (mofasError) {
    return {
      data: null,
      error: mofasError,
    };
  }

  const mofaMedicalIds = new Set(
    (mofas ?? [])
      .map(
        (item) => item.medical_id,
      )
      .filter(
        (
          medicalId,
        ): medicalId is string =>
          Boolean(medicalId),
      ),
  );

  const pending: MofaPendingMedical[] = [];

  for (const medical of medicals ?? []) {
    /*
     * Supabase may return candidate as:
     *
     * candidate
     * candidate[]
     *
     * depending on the generated relation type.
     */
    const rawCandidate =
      Array.isArray(medical.candidate)
        ? medical.candidate[0] ?? null
        : medical.candidate;

    /*
     * A medical without a candidate
     * cannot be used for MOFA.
     */
    if (!rawCandidate) {
      continue;
    }

    /*
     * Skip medicals that already have a MOFA.
     */
    if (
      mofaMedicalIds.has(
        medical.id,
      )
    ) {
      continue;
    }

    const rawAgent =
      Array.isArray(
        rawCandidate.agent,
      )
        ? rawCandidate.agent[0] ?? null
        : rawCandidate.agent;

    const candidate: MofaCandidate = {
      id: rawCandidate.id,

      name: rawCandidate.name,

      passport_no:
        rawCandidate.passport_no,

      received_date:
        rawCandidate.received_date,

      country:
        rawCandidate.country as MofaCandidateCountry,

      sl:
        rawCandidate.sl,

      agent_id:
        rawCandidate.agent_id,

      agent: rawAgent
        ? {
            id: rawAgent.id,
            name: rawAgent.name,
            code: rawAgent.code,
          }
        : null,
    };

    pending.push({
      id: medical.id,

      medical_date:
        medical.medical_date,

      fit_date:
        medical.fit_date,

      status:
        medical.status as MofaMedicalStatus,

      candidate,
    });
  }

  return {
    data: pending,
    error: null,
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

    if (!error && data) {
      try {
        await syncCandidateWorkflowState(
          values.candidate_id,
        );
      } catch (workflowError) {
        console.error(
          "Failed to sync candidate workflow state after MOFA create:",
          workflowError,
        );
      }
    }

    return {
      data:
        data as Mofa | null,
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

    if (!error && data) {
      try {
        await syncCandidateWorkflowState(
          values.candidate_id,
        );
      } catch (workflowError) {
        console.error(
          "Failed to sync candidate workflow state after MOFA update:",
          workflowError,
        );
      }
    }

    return {
      data:
        data as Mofa | null,
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