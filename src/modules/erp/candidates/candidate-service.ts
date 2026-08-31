// src/modules/erp/candidates/candidate-service.ts

import { supabase } from "@/lib/supabase/client";

import type {
  Candidate,
  CandidateInput,
  CandidateReference,
} from "./candidate-types";

export type {
  Candidate,
  CandidateInput,
  CandidateReference,
} from "./candidate-types";


/* =========================================================
   CANDIDATE SELECT
   ---------------------------------------------------------
   Candidate module-এর primary read contract.

   IMPORTANT:
   অন্য component/module-এ:

     .from("candidates")
     .select("*")

   ব্যবহার না করে এই service ব্যবহার করবে।

   এতে future-এ:
   - query optimization
   - TanStack Query
   - Dexie
   - IndexedDB
   - server-side pagination

   সহজে add করা যাবে।
========================================================= */

const CANDIDATE_SELECT = `
  id,
  tenant_id,
  sl,
  passport_no,
  name,
  received_date,
  country,
  created_by,
  agent_id,
  agent:agents (
    id,
    name,
    code
  ),
  current_stage,
  is_returned,
  returned_date,
  returned_reason,
  final_status,
  final_reason,
  is_deleted,
  created_at,
  updated_at
`;


/* =========================================================
   LIGHTWEIGHT REFERENCE SELECT
   ---------------------------------------------------------
   Medical / MOFA / Finger / Visa / Flight-এর মতো module
   যখন শুধু candidate identify করতে চায়।

   পুরো Candidate row fetch করবে না।
========================================================= */

const CANDIDATE_REFERENCE_SELECT = `
  id,
  sl,
  passport_no,
  name
`;


/* =========================================================
   LIST CANDIDATES
   ---------------------------------------------------------
   Main Candidate page query.

   NOTE:
   এখন client-side filtering রাখা হয়েছে কারণ existing
   Candidate page সেটাই ব্যবহার করছে।

   Future-এ pagination/search/filter server-side করা যাবে।
========================================================= */

export async function getCandidates(): Promise<Candidate[]> {

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT)
    .eq("is_deleted", false)
    .order("created_at", {
      ascending: false,
    });


  if (error) {
    throw error;
  }


  return (data ?? []) as unknown as Candidate[];

}


/* =========================================================
   GET CANDIDATE BY ID
========================================================= */

export async function getCandidateById(
  id: string,
): Promise<Candidate | null> {

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT)
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();


  if (error) {
    throw error;
  }


  return data as Candidate | null;

}


/* =========================================================
   GET CANDIDATE REFERENCES
   ---------------------------------------------------------
   Lightweight query for other modules.

   Example:

   Medical candidate selector
   MOFA candidate selector
   Visa candidate selector

   তারা শুধু এই data পাবে:

     id
     sl
     passport_no
     name
========================================================= */

export async function getCandidateReferences(): Promise<
  CandidateReference[]
> {

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(CANDIDATE_REFERENCE_SELECT)
    .eq("is_deleted", false)
    .order("sl", {
      ascending: true,
    });


  if (error) {
    throw error;
  }


  return (data ?? []) as CandidateReference[];

}


/* =========================================================
   GET CANDIDATE REFERENCE BY ID
========================================================= */

export async function getCandidateReferenceById(
  id: string,
): Promise<CandidateReference | null> {

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(CANDIDATE_REFERENCE_SELECT)
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();


  if (error) {
    throw error;
  }


  return data as CandidateReference | null;

}


/* =========================================================
   RETURN CANDIDATE
   ---------------------------------------------------------
   Returned ≠ Cancelled

   Returned means candidate/passport physically returned.

   Data remains in candidates table.

   Later:
     returned → active

   করা যাবে।
========================================================= */

export async function returnCandidate(
  candidateId: string,
  returnedDate: string,
  reason?: string,
): Promise<void> {

  const now =
    new Date().toISOString();


  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      is_returned: true,

      returned_date:
        returnedDate,

      returned_reason:
        reason?.trim() || null,

      updated_at:
        now,
    })
    .eq(
      "id",
      candidateId,
    );


  if (error) {
    throw error;
  }

}


/* =========================================================
   RESTORE RETURNED CANDIDATE
   ---------------------------------------------------------
   returned → active

   IMPORTANT:
   returned_reason delete করছি না।

   কারণ reason historical information।

   Future audit/history table এ গেলে এই data আরও
   properly preserve করা যাবে।
========================================================= */

export async function restoreReturnedCandidate(
  candidateId: string,
): Promise<void> {

  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      is_returned: false,

      returned_date: null,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      candidateId,
    );


  if (error) {
    throw error;
  }

}


/* =========================================================
   CANCEL CANDIDATE
   ---------------------------------------------------------
   Cancelled means:

   - workflow stopped
   - candidate data remains
   - future-এ reactivate করা যাবে
   - cancellation reason preserved
========================================================= */

export async function cancelCandidate(
  candidateId: string,
  reason: string,
): Promise<void> {

  const cleanReason =
    reason.trim();


  if (!cleanReason) {

    throw new Error(
      "Cancellation reason is required.",
    );

  }


  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      final_status: "cancelled",

      final_reason:
        cleanReason,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      candidateId,
    );


  if (error) {
    throw error;
  }

}


/* =========================================================
   COMPLETE CANDIDATE
   ---------------------------------------------------------
   Complete:

   - workflow successfully finished
   - final state
   - candidate remains in database
========================================================= */

export async function completeCandidate(
  candidateId: string,
  reason?: string,
): Promise<void> {

  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      final_status: "complete",

      final_reason:
        reason?.trim() || null,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      candidateId,
    );


  if (error) {
    throw error;
  }

}


/* =========================================================
   REACTIVATE CANCELLED CANDIDATE
   ---------------------------------------------------------
   cancelled → active

   Active database state:

     final_status = NULL
     is_returned = false
========================================================= */

export async function reactivateCandidate(
  candidateId: string,
): Promise<void> {

  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      final_status: null,

      final_reason: null,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      candidateId,
    );


  if (error) {
    throw error;
  }

}


/* =========================================================
   UPDATE CURRENT STAGE
   ---------------------------------------------------------
   Candidate-এর global stage পরিবর্তনের একমাত্র service
   entry point।

   Module-specific sub-stage এখানে থাকবে না।

   Example:

     medical module complete
          ↓
     current_stage = mofa
========================================================= */

export async function updateCandidateStage(
  candidateId: string,
  stage: Candidate["current_stage"],
): Promise<void> {

  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      current_stage: stage,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      candidateId,
    );


  if (error) {
    throw error;
  }

}


/* =========================================================
   SOFT DELETE
   ---------------------------------------------------------
   Candidate physically delete না করে hidden করা হবে।

   এতে related module data এবং historical reference
   safer থাকবে।
========================================================= */

export async function softDeleteCandidate(
  candidateId: string,
): Promise<void> {

  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      is_deleted: true,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      candidateId,
    );


  if (error) {
    throw error;
  }

}


/* =========================================================
   COMPATIBILITY LAYER
   ---------------------------------------------------------
   নিচের functions গুলো এখনও পুরনো
   `{ data, error }` contract ব্যবহার করা component-দের
   জন্য (candidate-form-dialog, candidate-delete-dialog,
   candidate-profile-page)।

   উপরের সব function throw-based clean contract অনুসরণ
   করে — এইগুলো সেটাই wrap করে পুরনো contract-এ ফিরিয়ে দেয়,
   যাতে ওই component-গুলোর existing logic-এ হাত না দিতে হয়।
========================================================= */


/* ---------------------------------------------------------
   GET CANDIDATE (compat wrapper for getCandidateById)
--------------------------------------------------------- */

export async function getCandidate(
  id: string,
): Promise<{
  data: Candidate | null;
  error: { message?: string; code?: string } | null;
}> {

  try {

    const data =
      await getCandidateById(id);

    return {
      data,
      error: null,
    };

  } catch (error) {

    return {
      data: null,
      error: normalizeError(error),
    };

  }

}


/* ---------------------------------------------------------
   DELETE CANDIDATE (compat wrapper for softDeleteCandidate)
--------------------------------------------------------- */

export async function deleteCandidate(
  candidateId: string,
): Promise<{
  error: { message?: string; code?: string } | null;
}> {

  try {

    await softDeleteCandidate(
      candidateId,
    );

    return {
      error: null,
    };

  } catch (error) {

    return {
      error: normalizeError(error),
    };

  }

}


/* ---------------------------------------------------------
   NORMALIZE ERROR
   ---------------------------------------------------------
   throw করা error (unknown) কে পুরনো `{ message, code }`
   shape-এ normalize করে, যাতে old-style component-গুলো
   error.message নিরাপদে পড়তে পারে।
--------------------------------------------------------- */

function normalizeError(
  error: unknown,
): {
  message?: string;
  code?: string;
} {

  if (
    error &&
    typeof error === "object"
  ) {

    return error as {
      message?: string;
      code?: string;
    };

  }


  return {
    message: String(error),
  };

}


/* ---------------------------------------------------------
   CREATE CANDIDATE
   ---------------------------------------------------------
   IMPORTANT:

   tenant_id frontend থেকে নেওয়া হচ্ছে না।

   Current authenticated user-এর tenant
   Supabase `get_my_tenant_id()` RPC function-এর
   মাধ্যমে automatically resolve করা হচ্ছে।

   Flow:

     auth user
        ↓
     get_my_tenant_id()
        ↓
     profiles.tenant_id
        ↓
     tenant_id
        ↓
     candidates INSERT

   ফলে CandidateInput-এ tenant_id রাখার দরকার নেই।

   RLS আবার নিশ্চিত করবে:

     tenant_id = get_my_tenant_id()
--------------------------------------------------------- */

export async function createCandidate(
  input: CandidateInput,
) {

  /* -------------------------------------------------------
     CURRENT AUTH USER
     ------------------------------------------------------- */

  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();


  if (userError) {

    return {
      data: null,
      error: userError,
    };

  }


  if (!user) {

    return {
      data: null,
      error: {
        message:
          "User is not authenticated.",
        code:
          "AUTH_REQUIRED",
      },
    };

  }


  /* -------------------------------------------------------
     GET CURRENT USER'S TENANT
     ------------------------------------------------------- */

  const {
    data: tenantId,
    error: tenantError,
  } = await supabase.rpc(
    "get_my_tenant_id",
  );


  if (tenantError) {

    return {
      data: null,
      error: tenantError,
    };

  }


  if (!tenantId) {

    return {
      data: null,
      error: {
        message:
          "Unable to determine current tenant.",
        code:
          "TENANT_NOT_FOUND",
      },
    };

  }


  /* -------------------------------------------------------
     INSERT CANDIDATE
     -------------------------------------------------------
     tenant_id service নিজেই inject করছে।

     created_by-ও authenticated user থেকে নেওয়া হচ্ছে।

     `sl` এখানে দেওয়া হচ্ছে না।
     Existing database trigger:

       candidates_set_sl
            ↓
       set_candidate_sl()
            ↓
       generate_candidate_sl()

     automatically SL generate করবে।
  ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .insert({
      ...input,

      tenant_id:
        tenantId,

      created_by:
        user.id,
    })
    .select(CANDIDATE_SELECT)
    .single();


  return {
    data:
      data as Candidate | null,

    error,
  };

}


/* ---------------------------------------------------------
   UPDATE CANDIDATE
--------------------------------------------------------- */

export async function updateCandidate(
  candidateId: string,
  input: CandidateInput,
) {

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .update(input)
    .eq("id", candidateId)
    .select(CANDIDATE_SELECT)
    .single();


  return {
    data:
      data as Candidate | null,

    error,
  };

}
