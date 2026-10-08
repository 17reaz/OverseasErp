import { supabase } from "@/lib/supabase/client";
import { syncCandidateWorkflowState } from "../workflow/workflow-service";

/* =========================================================
 * TYPES
 * ======================================================= */

export type MofaStage = "assigned" | "new" | "medupdated" | "approved";

export type MofaValidityStatus = "active" | "used" | "expired" | "invalid";

export type MofaMedicalStatus = "new" | "fit" | "unfit" | "expired";

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

/**
 * Relation: visas.mofa_id -> mofas.id
 * Visas are loaded separately instead of using a nested Supabase relation.
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

/** NOTE: the agencies table does NOT have a country column. */
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

export interface Mofa {
  id: string;
  tenant_id: string;
  sl: number;

  candidate_id: string;
  medical_id: string | null;
  agency_id: string | null;

  application_number: string | null;
  application_date: string;
  trade: string;

  stage: MofaStage;
  validity_status: MofaValidityStatus;

  created_at: string;
  updated_at: string;

  candidate?: MofaCandidate | null;
  medical?: MofaMedical | null;
  agency?: MofaAgency | null;

  /** One MOFA may have zero or more visa records. */
  visas?: MofaVisa[];
}

export interface MofaInput {
  candidate_id: string;
  medical_id: string | null;
  agency_id: string | null;
  application_number: string | null;
  application_date: string | null;
  trade: string | null;
  stage: MofaStage;
}

/** Medical that is fit and not yet linked to any MOFA. */
export interface MofaPendingMedical {
  id: string;
  medical_date: string | null;
  fit_date: string | null;
  status: MofaMedicalStatus;
  candidate: MofaCandidate;
}

/* =========================================================
 * SELECT FRAGMENTS
 * ======================================================= */

const candidateFields = `
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

const medicalFields = `
  id,
  tenant_id,
  candidate_id,
  medical_date,
  fit_date,
  status,
  created_at,
  updated_at
`;

const agencyFields = `
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
`;

const visaFields = `
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

/** Visa is intentionally NOT nested; it is loaded through mofa_id. */
const mofaSelect = `
  *,
  candidate:candidates (${candidateFields}),
  medical:medicals (${medicalFields}),
  agency:agencies (${agencyFields})
`;

const pendingMedicalSelect = `
  id,
  medical_date,
  fit_date,
  status,
  candidate:candidates (${candidateFields})
`;

/* =========================================================
 * HELPERS
 * ======================================================= */

/** Supabase may return a relation as an object or as an array. */
function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toError(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

async function getCurrentTenantId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.tenant_id) {
    throw new Error("Tenant information is missing.");
  }

  return profile.tenant_id;
}

/**
 * Database requires application_date and trade to be NOT NULL.
 * application_number is optional: empty values are stored as NULL.
 * Medical is optional: without medical_id the MOFA record is preserved
 * but its validity_status is set to "invalid".
 */
function normalizeMofaInput(input: MofaInput) {
  if (!input.candidate_id) {
    throw new Error("Candidate is required.");
  }

  const applicationNumber = input.application_number?.trim() || null;

  const applicationDate =
    input.application_date?.trim() || new Date().toISOString().slice(0, 10);

  const trade = input.trade?.trim() || "Not Specified";

  // undefined = field is not sent (DB default / current value is kept).
  const validityStatus: MofaValidityStatus | undefined = input.medical_id
    ? undefined
    : "invalid";

  return {
    candidate_id: input.candidate_id,
    medical_id: input.medical_id || null,
    agency_id: input.agency_id || null,
    application_number: applicationNumber,
    application_date: applicationDate,
    trade,
    stage: input.stage,
    validity_status: validityStatus,
  };
}

async function syncWorkflowSafely(candidateId: string, action: "create" | "update") {
  try {
    await syncCandidateWorkflowState(candidateId);
  } catch (workflowError) {
    console.error(
      `Failed to sync candidate workflow state after MOFA ${action}:`,
      workflowError,
    );
  }
}

/** Attaches visas to each MOFA (visas.mofa_id = mofas.id). */
async function attachMofaVisas(mofas: Mofa[]) {
  if (mofas.length === 0) {
    return mofas;
  }

  const { data: visas, error } = await supabase
    .from("visas")
    .select(visaFields)
    .in(
      "mofa_id",
      mofas.map((mofa) => mofa.id),
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const visasByMofa = new Map<string, MofaVisa[]>();

  for (const visa of (visas ?? []) as MofaVisa[]) {
    if (!visa.mofa_id) {
      continue;
    }

    const existing = visasByMofa.get(visa.mofa_id) ?? [];
    existing.push(visa);
    visasByMofa.set(visa.mofa_id, existing);
  }

  return mofas.map((mofa) => ({
    ...mofa,
    visas: visasByMofa.get(mofa.id) ?? [],
  }));
}

/* =========================================================
 * READ
 * ======================================================= */

export async function getMofas() {
  try {
    const { data, error } = await supabase
      .from("mofas")
      .select(mofaSelect)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const mofasWithVisas = await attachMofaVisas((data ?? []) as Mofa[]);

    return { data: mofasWithVisas, error: null };
  } catch (error) {
    return {
      data: null,
      error: toError(error, "Failed to load MOFA records."),
    };
  }
}

/**
 * Medical is optional. A candidate can have:
 *
 * Candidate
 *   ├── MOFA
 *   ├── Medical #1 → MOFA
 *   ├── Medical #2 → MOFA
 *   └── Medical #3 → MOFA
 */
export async function getMofaCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select(candidateFields)
    .eq("is_deleted", false)
    .order("sl", { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const candidates: MofaCandidate[] = (data ?? []).map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    passport_no: candidate.passport_no,
    received_date: candidate.received_date,
    country: candidate.country,
    sl: candidate.sl,
    agent_id: candidate.agent_id,
    agent: unwrapRelation(candidate.agent),
  }));

  return { data: candidates, error: null };
}

/** The same candidate can have multiple medical records. */
export async function getCandidateMedicals(candidateId: string) {
  const { data, error } = await supabase
    .from("medicals")
    .select(medicalFields)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  return { data: data as MofaMedical[] | null, error };
}

/** Fit medicals that do NOT have a MOFA yet. */
export async function getFitMedicalsWithoutMofa() {
  const { data: medicals, error: medicalsError } = await supabase
    .from("medicals")
    .select(pendingMedicalSelect)
    .eq("status", "fit")
    .order("fit_date", { ascending: false });

  if (medicalsError) {
    return { data: null, error: medicalsError };
  }

  const { data: mofas, error: mofasError } = await supabase
    .from("mofas")
    .select("medical_id");

  if (mofasError) {
    return { data: null, error: mofasError };
  }

  const mofaMedicalIds = new Set(
    (mofas ?? [])
      .map((item) => item.medical_id)
      .filter((medicalId): medicalId is string => Boolean(medicalId)),
  );

  const pending: MofaPendingMedical[] = [];

  for (const medical of medicals ?? []) {
    const rawCandidate = unwrapRelation(medical.candidate);

    // A medical without a candidate cannot be used for MOFA.
    if (!rawCandidate) {
      continue;
    }

    // Skip medicals that already have a MOFA.
    if (mofaMedicalIds.has(medical.id)) {
      continue;
    }

    const rawAgent = unwrapRelation(rawCandidate.agent);

    pending.push({
      id: medical.id,
      medical_date: medical.medical_date,
      fit_date: medical.fit_date,
      status: medical.status as MofaMedicalStatus,
      candidate: {
        id: rawCandidate.id,
        name: rawCandidate.name,
        passport_no: rawCandidate.passport_no,
        received_date: rawCandidate.received_date,
        country: rawCandidate.country as MofaCandidateCountry,
        sl: rawCandidate.sl,
        agent_id: rawCandidate.agent_id,
        agent: rawAgent
          ? {
              id: rawAgent.id,
              name: rawAgent.name,
              code: rawAgent.code,
            }
          : null,
      },
    });
  }

  return { data: pending, error: null };
}

export async function getMofaAgencies() {
  const { data, error } = await supabase
    .from("agencies")
    .select(agencyFields)
    .eq("is_active", true)
    .order("sl", { ascending: true });

  return { data: data as MofaAgency[] | null, error };
}

/** Backward compatibility: mofa-form.tsx may import getAgencies(). */
export async function getAgencies() {
  return getMofaAgencies();
}

/* =========================================================
 * WRITE
 * ======================================================= */

export async function createMofa(input: MofaInput) {
  try {
    const tenantId = await getCurrentTenantId();
    const values = normalizeMofaInput(input);

    const { data, error } = await supabase
      .from("mofas")
      .insert({
        tenant_id: tenantId,
        ...values,
      })
      .select(mofaSelect)
      .single();

    if (!error && data) {
      await syncWorkflowSafely(values.candidate_id, "create");
    }

    return { data: data as Mofa | null, error };
  } catch (error) {
    return {
      data: null,
      error: toError(error, "Failed to create MOFA."),
    };
  }
}

export async function updateMofa(id: string, input: MofaInput) {
  try {
    if (!id) {
      throw new Error("MOFA ID is required.");
    }

    const values = normalizeMofaInput(input);

    const { data, error } = await supabase
      .from("mofas")
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(mofaSelect)
      .single();

    if (!error && data) {
      await syncWorkflowSafely(values.candidate_id, "update");
    }

    return { data: data as Mofa | null, error };
  } catch (error) {
    return {
      data: null,
      error: toError(error, "Failed to update MOFA."),
    };
  }
}

export async function deleteMofa(id: string) {
  if (!id) {
    return { error: new Error("MOFA ID is required.") };
  }

  const { error } = await supabase.from("mofas").delete().eq("id", id);

  return { error };
}