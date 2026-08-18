import { supabase } from "@/lib/supabase/client";

export type CandidateCountry =
  | "Saudi Arabia"
  | "Mauritius"
  | "Laos"
  | "Malaysia"
  | "Belarus"
  | null;

export interface Candidate {
  id: string;
  tenant_id: string;

  passport_no: string;
  name: string;

  received_date: string | null;
  country: CandidateCountry;

  created_by: string | null;
  current_stage: string | null;

  is_deleted: boolean;

  created_at: string;
  updated_at: string;

  is_returned: boolean;
  returned_date: string | null;

  sl: number | null;

  // Supabase schema অনুযায়ী uuid
  agent_id: string | null;
}

export interface CandidateInput {
  passport_no: string;
  name: string;
  received_date: string | null;
  country: Exclude<CandidateCountry, null> | null;
  agent_id: string | null;
  current_stage: string | null;
}

export async function getCurrentUserContext() {
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

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.tenant_id) {
    throw new Error("No tenant is assigned to this user.");
  }

  return {
    user,
    tenantId: profile.tenant_id as string,
  };
}


// ======================================================
// GET ALL CANDIDATES
// ======================================================

export async function getCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", {
      ascending: false,
    });

  return {
    data: data as Candidate[] | null,
    error,
  };
}


// ======================================================
// GET SINGLE CANDIDATE
// ======================================================

export async function getCandidate(id: string) {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  return {
    data: data as Candidate | null,
    error,
  };
}


// ======================================================
// CREATE CANDIDATE
// ======================================================

export async function createCandidate(
  input: CandidateInput,
) {
  const {
    user,
    tenantId,
  } = await getCurrentUserContext();

  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .insert({
      tenant_id: tenantId,

      created_by: user.id,

      passport_no:
        input.passport_no.trim(),

      name:
        input.name.trim(),

      received_date:
        input.received_date || null,

      country:
        input.country,

      agent_id:
        input.agent_id || null,

      current_stage:
        input.current_stage || "Pending",
    })
    .select("*")
    .single();

  return {
    data: data as Candidate | null,
    error,
  };
}


// ======================================================
// UPDATE CANDIDATE
// ======================================================

export async function updateCandidate(
  id: string,
  input: CandidateInput,
) {
  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .update({
      passport_no:
        input.passport_no.trim(),

      name:
        input.name.trim(),

      received_date:
        input.received_date || null,

      country:
        input.country,

      agent_id:
        input.agent_id || null,

      current_stage:
        input.current_stage || "Pending",

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_deleted", false)
    .select("*")
    .single();

  return {
    data: data as Candidate | null,
    error,
  };
}


// ======================================================
// SOFT DELETE CANDIDATE
// ======================================================

export async function deleteCandidate(
  id: string,
) {
  const {
    error,
  } = await supabase
    .from("candidates")
    .update({
      is_deleted: true,

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_deleted", false);

  return {
    error,
  };
}