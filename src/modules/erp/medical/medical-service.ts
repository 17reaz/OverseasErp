import { supabase } from "@/lib/supabase/client";
import { updateCandidateStage } from "../candidates/candidate-service";
import { syncCandidateWorkflowState } from "../workflow/workflow-service";

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

if (!error && data) {

  try {

    await syncCandidateWorkflowState(
      input.candidate_id,
    );

  } catch (workflowError) {

    console.error(
      "Failed to sync candidate workflow state after medical create:",
      workflowError,
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

  if (!error && data) {

    try {

      await syncCandidateWorkflowState(
        input.candidate_id,
      );

    } catch (workflowError) {

      console.error(
        "Failed to sync candidate workflow state after medical update:",
        workflowError,
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
/* =========================================================
   MEDICAL PIPELINE
   ---------------------------------------------------------
   Used by Medical Grid.

   Relationship:

   Medical ─┐
   MOFA ────┼── candidate_id → Candidate
   Visa ────┘

   No N+1 queries.
   ========================================================= */

export interface MedicalPipelineMofa {
  id: string;

  application_date:
    | string
    | null;

  application_number:
    | string
    | null;

  stage:
    | string
    | null;

  created_at: string;
}


export interface MedicalPipelineVisa {
  id: string;

  visa_no:
    | string
    | null;

  visa_date:
    | string
    | null;

  expiry_date:
    | string
    | null;

  status:
    | string
    | null;

  created_at: string;
}


export interface MedicalPipelineItem {
  medical: Medical;

  candidate: MedicalCandidate;

  mofa:
    | MedicalPipelineMofa
    | null;

  visa:
    | MedicalPipelineVisa
    | null;
}


/* =========================================================
   LATEST RECORD BY CANDIDATE
   ========================================================= */

function latestByCandidate<
  T extends {
    candidate_id: string;
    created_at: string;
  },
>(
  rows: T[],
) {
  const map = new Map<
    string,
    T
  >();

  for (const row of rows) {
    if (!map.has(row.candidate_id)) {
      map.set(
        row.candidate_id,
        row,
      );
    }
  }

  return map;
}


/* =========================================================
   GET MEDICAL PIPELINE
   ========================================================= */

export async function getMedicalPipelineItems() {
  const [
    medicalResult,
    mofaResult,
    visaResult,
  ] = await Promise.all([
    supabase
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
      ),

    supabase
      .from("mofas")
      .select(`
        id,
        candidate_id,
        application_date,
        application_number,
        stage,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from("visas")
      .select(`
        id,
        candidate_id,
        visa_no,
        visa_date,
        expiry_date,
        status,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),
  ]);


  if (medicalResult.error) {
    return {
      data: null,
      error: medicalResult.error,
    };
  }


  if (mofaResult.error) {
    return {
      data: null,
      error: mofaResult.error,
    };
  }


  if (visaResult.error) {
    return {
      data: null,
      error: visaResult.error,
    };
  }


  const medicals =
    (medicalResult.data ??
      []) as Medical[];


  const mofas =
    (mofaResult.data ??
      []) as MedicalPipelineMofa[];


  const visas =
    (visaResult.data ??
      []) as MedicalPipelineVisa[];


  const mofaMap =
    latestByCandidate(
      mofas as Array<
        MedicalPipelineMofa & {
          candidate_id: string;
        }
      >,
    );


  const visaMap =
    latestByCandidate(
      visas as Array<
        MedicalPipelineVisa & {
          candidate_id: string;
        }
      >,
    );


  const items: MedicalPipelineItem[] =
    medicals
      .filter(
        (
          medical,
        ) => !!medical.candidate,
      )
      .map(
        (medical) => {
          const candidate =
            medical.candidate as MedicalCandidate;

          return {
            medical,

            candidate,

            mofa:
              mofaMap.get(
                medical.candidate_id,
              ) ?? null,

            visa:
              visaMap.get(
                medical.candidate_id,
              ) ?? null,
          };
        },
      );


  return {
    data: items,
    error: null,
  };
}