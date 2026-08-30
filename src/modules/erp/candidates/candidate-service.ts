// src/modules/erp/candidates/candidate-service.ts

import { supabase } from "@/lib/supabase/client";

import type {
  Candidate,
  CandidateReference,
} from "./candidate-types";


/* =========================================================
   CANDIDATE SELECT CONTRACT
   ---------------------------------------------------------
   Candidate module-এর full read model.

   অন্য module-এর প্রয়োজন না হলে এটি ব্যবহার করবে না।
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
   CANDIDATE REFERENCE SELECT
   ---------------------------------------------------------
   Medical / MOFA / Finger / Visa / Flight
   candidate identify করার জন্য শুধু প্রয়োজনীয় data.

   IMPORTANT:
   অন্য module পুরো Candidate row fetch করবে না
   যদি শুধু identity দরকার হয়।
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


  return (data ?? []) as Candidate[];
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
   LIGHTWEIGHT CANDIDATE REFERENCES
   ---------------------------------------------------------
   Used by:
   - Medical
   - MOFA
   - Finger
   - Police Clearance
   - Takamul
   - Visa
   - Flight

   এগুলো Candidate source of truth থেকে identity নেয়,
   কিন্তু Candidate-এর complete row নেয় না।
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

   Returned:
   - passport physically returned
   - candidate remains in database
   - later restored করা যাবে
========================================================= */

export async function returnCandidate(
  candidateId: string,
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
        now.slice(0, 10),

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
      returned_reason: null,
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
   cancelled:
   - workflow stops
   - data remains
   - can be reactivated later

   NOTE:
   final_status = cancelled
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
      final_reason: cleanReason,
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
   Complete সাধারণত শেষ module থেকে আসবে।

   Example:
   Flight completed
          ↓
   completeCandidate()
          ↓
   candidates.final_status = complete
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

   Active:
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