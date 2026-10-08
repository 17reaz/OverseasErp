import { supabase } from "@/lib/supabase/client";
import { recordFinanceEvent } from "../accounts/events/finance-event-service";
import { updateCandidateStage } from "../candidates/candidate-service";
import { syncCandidateWorkflowState } from "../workflow/workflow-service";

export type MedicalStatus =
  | "new"
  | "fit"
  | "unfit"
  | "slip"
  | "inprogress"
  | "under_review";
  export type MedicalValidityStatus =
  | "active"
  | "used"
  | "expired"
  | "invalid";

export type MedicalValidityAction =
  | "active"
  | "expired"
  | "invalid";
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

  country: MedicalCandidateCountry;

  sl: number | null;

  agent_id: string | null;

  agent: MedicalCandidateAgent | null;
}

export interface Medical {
  id: string;

  tenant_id: string;

  candidate_id: string;

  medical_date: string | null;

  fit_date: string | null;

  status: MedicalStatus;

  validity_status: MedicalValidityStatus;

  created_at: string;

  updated_at: string;

  candidate?: MedicalCandidate | null;
}

/*
 * =========================================================
 * MEDICAL FINANCE INPUT
 * =========================================================
 *
 * Finance integration is completely optional.
 *
 * enabled: false
 *   → Medical is handled without Finance.
 *
 * enabled: true
 *   → Medical completion creates a Finance event.
 *
 * Important:
 *
 * Service completion and payment are separate financial
 * events. This finance object only records the financial
 * effect of the Medical service itself.
 * =========================================================
 */

export interface MedicalFinanceInput {
  enabled: boolean;

  amount?: number;

  accountId?: string;

  categoryId?: string | null;

  partyId?: string | null;

  transactionType?: "income" | "expense";
}

export interface MedicalInput {
  candidate_id: string;

  medical_date: string | null;

  fit_date: string | null;

  status: MedicalStatus;

  advance_stage?: boolean;

  finance?: MedicalFinanceInput;
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

  /*
   * =======================================================
   * VALIDATE OPTIONAL FINANCE INPUT
   * =======================================================
   *
   * We only validate Finance fields when the user explicitly
   * enabled Finance recording.
   */

  if (input.finance?.enabled) {
    if (
      typeof input.finance.amount !== "number" ||
      !Number.isFinite(input.finance.amount) ||
      input.finance.amount <= 0
    ) {
      throw new Error(
        "Medical Finance amount must be greater than zero.",
      );
    }

    if (
      !input.finance.accountId?.trim()
    ) {
      throw new Error(
        "A Finance account is required when Medical Finance is enabled.",
      );
    }

    if (
      input.finance.transactionType !==
        "income" &&
      input.finance.transactionType !==
        "expense"
    ) {
      throw new Error(
        "A valid Finance transaction type is required when Medical Finance is enabled.",
      );
    }
  }

  /*
   * =======================================================
   * CREATE MEDICAL
   * =======================================================
   */

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

  /*
   * =======================================================
   * STOP HERE IF MEDICAL CREATION FAILED
   * =======================================================
   */

  if (error) {
    return {
      data:
        data as Medical | null,

      error,
    };
  }

  /*
   * =======================================================
   * FINANCE EVENT
   * =======================================================
   *
   * Finance is intentionally optional.
   *
   * If the Medical is handled internally/client-side:
   *
   *   finance.enabled = false
   *
   * No Finance event is generated.
   *
   * If the Medical has an actual financial effect:
   *
   *   finance.enabled = true
   *
   * Then the Event Engine records service.completed.
   *
   * IMPORTANT:
   *
   * This happens only after the Medical record has been
   * successfully created.
   *
   * We do NOT rollback the Medical if Finance processing
   * fails. Finance is an integration layer, not the owner
   * of the Medical business record.
   * =======================================================
   */

  if (
    data &&
    input.finance?.enabled
  ) {
    try {
      await recordFinanceEvent({
        event: "service.completed",

        module: "medical",

        source: {
          type: "medical",
          id: data.id,
        },

        candidateId:
          input.candidate_id,

        service: {
          code: "MEDICAL",
          name: "Medical",
        },

        amount:
          input.finance.amount!,

        date:
          input.medical_date ??
          data.created_at,

        description:
          `Medical service for candidate ${input.candidate_id}`,

        reference:
          `MEDICAL-${data.id}`,

        party:
          input.finance.partyId
            ? {
                type: "vendor",
                id: input.finance.partyId,
              }
            : null,

        finance: {
          accountId:
            input.finance.accountId!,

          categoryId:
            input.finance.categoryId ??
            null,

          partyId:
            input.finance.partyId ??
            null,

          transactionType:
            input.finance.transactionType!,
        },
      });
    } catch (financeError) {
      /*
       * Medical itself was successfully created.
       *
       * Finance failure must not break the Medical workflow.
       * Log the error so it can be investigated/reprocessed
       * later.
       */

      console.error(
        "Failed to record Medical Finance event:",
        financeError,
      );
    }
  }

  /*
   * =======================================================
   * AUTO ADVANCE CANDIDATE STAGE
   * =======================================================
   */

  if (
    data &&
    input.advance_stage !== false
  ) {
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

  /*
   * =======================================================
   * SYNC WORKFLOW STATE
   * =======================================================
   */

  if (data) {
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
 *
 * IMPORTANT:
 *
 * We intentionally do NOT create a Finance event here.
 *
 * Otherwise every edit to Medical could create another
 * service.completed transaction.
 *
 * Future:
 *
 *   Medical cancellation
 *        ↓
 *   service.cancelled
 *
 *   Medical financial adjustment
 *        ↓
 *   service.reversed
 *
 * Those will be handled as separate events.
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
export async function reviewMedicalValidity(
  medicalId: string,
  action: MedicalValidityAction,
) {
  const { data, error } = await supabase
    .from("medicals")
    .update({
      validity_status: action,
      updated_at: new Date().toISOString(),
    })
    .eq("id", medicalId)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to update medical validity: ${error.message}`,
    );
  }

  return data as Medical;
}
export async function getMedicalValidityReviews() {
  const { data, error } = await supabase
    .from("medicals")
    .select(`
      *,
      candidate:candidates (
        id,
        full_name,
        passport_number
      )
    `)
    .eq("validity_status", "active")
    .eq("status", "fit")
    .order("fit_date", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load medical validity reviews: ${error.message}`,
    );
  }

  const now = new Date();

  return (data ?? []).filter((medical) => {
    const baseDate = medical.fit_date || medical.medical_date;

    if (!baseDate) return false;

    const validUntil = new Date(baseDate);
    validUntil.setDate(validUntil.getDate() + 60);

    return validUntil.getTime() < now.getTime();
  }) as Medical[];
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

/*
 * =========================================================
 * MEDICAL PIPELINE
 * ---------------------------------------------------------
 * Used by Medical Grid.
 *
 * Relationship:
 *
 * Medical ─┐
 * MOFA ────┼── candidate_id → Candidate
 * Visa ────┘
 *
 * No N+1 queries.
 * =========================================================
 */

export interface MedicalPipelineMofa {
  id: string;

  candidate_id: string;

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

  candidate_id: string;

  mofa_id: string | null;

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

/*
 * =========================================================
 * MEDICAL PIPELINE FILTER HELPERS
 * =========================================================
 */
function isMedicalValid(
  medical: Medical,
) {
  if (
    medical.validity_status !== "active"
  ) {
    return false;
  }

  if (medical.status !== "fit") {
    return false;
  }

  const baseDate =
    medical.fit_date ||
    medical.medical_date;

  if (!baseDate) {
    return false;
  }

  const validUntil = new Date(
    baseDate,
  );

  validUntil.setDate(
    validUntil.getDate() + 60,
  );

  return (
    validUntil.getTime() >=
    Date.now()
  );
}

function isVisaIssued(
  visa: MedicalPipelineVisa | null,
) {
  const status =
    visa?.status?.toLowerCase();

  return (
    status === "issued" ||
    status === "approved"
  );
}

/*
 * =========================================================
 * GET MEDICAL PIPELINE
 * =========================================================
 */

export async function getMedicalPipelineItems() {
  /*
   * =======================================================
   * LOAD MEDICAL PIPELINE
   *
   * Relation:
   *
   * Candidate
   *   ↓ candidate_id
   * MOFA
   *   ↓ mofa.id = visa.mofa_id
   * Visa
   *
   * IMPORTANT:
   *
   * Do NOT map Visa directly by candidate_id.
   * Visa belongs to MOFA through mofa_id.
   * =======================================================
   */

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
          sl,
          name,
          passport_no,
          country,
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
        mofa_id,
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

  /*
   * =======================================================
   * ERROR HANDLING
   * =======================================================
   */

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
    medicalResult.data ?? [];

  const mofas =
    mofaResult.data ?? [];

  const visas =
    visaResult.data ?? [];

  /*
   * =======================================================
   * LATEST MOFA PER CANDIDATE
   * =======================================================
   *
   * mofas are already ordered newest → oldest.
   * Therefore the first record for a candidate is the latest.
   */

  const mofaMap = new Map<
    string,
    MedicalPipelineMofa
  >();

  for (const mofa of mofas) {
    if (!mofa.candidate_id) {
      continue;
    }

    if (
      !mofaMap.has(
        mofa.candidate_id,
      )
    ) {
      mofaMap.set(
        mofa.candidate_id,
        mofa,
      );
    }
  }

  /*
   * =======================================================
   * VISA BY MOFA ID
   * =======================================================
   *
   * IMPORTANT:
   *
   * WRONG:
   *
   * visaMap.get(medical.candidate_id)
   *
   * CORRECT:
   *
   * visaByMofaId.get(mofa.id)
   *
   * Because:
   *
   * visas.mofa_id → mofas.id
   */

  const visaByMofaId = new Map<
    string,
    MedicalPipelineVisa
  >();

  for (const visa of visas) {
    if (!visa.mofa_id) {
      continue;
    }

    /*
     * Since visas are ordered newest → oldest,
     * keep only the latest Visa for each MOFA.
     */

    if (
      !visaByMofaId.has(
        visa.mofa_id,
      )
    ) {
      visaByMofaId.set(
        visa.mofa_id,
        visa,
      );
    }
  }

  /*
   * =======================================================
   * BUILD PIPELINE
   * =======================================================
   */

  const items: MedicalPipelineItem[] =
    medicals
      .filter(
        (medical) =>
          !!medical.candidate,
      )
      .map((medical) => {
        const candidate =
          medical.candidate as MedicalCandidate;

        /*
         * Candidate → latest MOFA
         */

        const mofa =
          mofaMap.get(
            medical.candidate_id,
          ) ?? null;

        /*
         * MOFA → latest Visa
         *
         * This is the critical relationship.
         */

        const visa =
          mofa?.id
            ? visaByMofaId.get(
                mofa.id,
              ) ?? null
            : null;

        return {
          medical,
          candidate,
          mofa,
          visa,
        };
      })
      /*
       * Keep only valid Medical records.
       *
       * Candidates whose Visa is already issued/approved
       * leave the Medical pipeline.
       */
      .filter(
        (item) =>
          isMedicalValid(
            item.medical,
          ) &&
          !isVisaIssued(
            item.visa,
          ),
      );

  return {
    data: items,
    error: null,
  };
}