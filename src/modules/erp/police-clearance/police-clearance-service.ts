import { supabase } from "@/lib/supabase/client";

export interface PoliceClearance {
  id: string;
  tenant_id: string;
  candidate_id: string;
  sl: number;
  received_date: string | null;
  verified: boolean;
  verified_date: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePoliceClearanceInput {
  candidate_id: string;
  received_date?: string | null;
  verified?: boolean;
  verified_date?: string | null;
  remarks?: string | null;
}

export interface UpdatePoliceClearanceInput {
  received_date?: string | null;
  verified?: boolean;
  verified_date?: string | null;
  remarks?: string | null;
}

/**
 * Get all police clearance records.
 *
 * Tenant isolation is handled by Supabase RLS.
 */
export async function getPoliceClearances(): Promise<
  PoliceClearance[]
> {
  const { data, error } = await supabase
    .from("police_clearances")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PoliceClearance[];
}

/**
 * Get all PCC records for a candidate.
 *
 * Multiple PCC records per candidate are allowed.
 */
export async function getPoliceClearancesByCandidate(
  candidateId: string,
): Promise<PoliceClearance[]> {
  const { data, error } = await supabase
    .from("police_clearances")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PoliceClearance[];
}

/**
 * Get one police clearance record.
 */
export async function getPoliceClearance(
  id: string,
): Promise<PoliceClearance> {
  const { data, error } = await supabase
    .from("police_clearances")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PoliceClearance;
}

/**
 * Create a police clearance record.
 *
 * tenant_id and sl are intentionally omitted.
 * Database triggers assign them automatically.
 */
export async function createPoliceClearance(
  input: CreatePoliceClearanceInput,
): Promise<PoliceClearance> {
  const verified = input.verified ?? false;

  const { data, error } = await supabase
    .from("police_clearances")
    .insert({
      candidate_id: input.candidate_id,
      received_date:
        input.received_date ?? null,
      verified,
      verified_date: verified
        ? input.verified_date ?? null
        : null,
      remarks: input.remarks ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PoliceClearance;
}

/**
 * Update a police clearance record.
 */
export async function updatePoliceClearance(
  id: string,
  input: UpdatePoliceClearanceInput,
): Promise<PoliceClearance> {
  const verified = input.verified ?? false;

  const { data, error } = await supabase
    .from("police_clearances")
    .update({
      received_date:
        input.received_date ?? null,
      verified,
      verified_date: verified
        ? input.verified_date ?? null
        : null,
      remarks: input.remarks ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PoliceClearance;
}

/**
 * Delete a police clearance record.
 */
export async function deletePoliceClearance(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("police_clearances")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}