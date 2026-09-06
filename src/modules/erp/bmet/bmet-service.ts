import { supabase } from "@/lib/supabase/client";

export interface BmetRecord {
  id: string;
  tenant_id: string;
  candidate_id: string;
  pdo: boolean;
  finger: boolean;
  nominee: boolean;
  bank: boolean;
  bmet: boolean;
  bmet_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBmetInput {
  candidate_id: string;
  pdo?: boolean;
  finger?: boolean;
  nominee?: boolean;
  bank?: boolean;
  bmet?: boolean;
  bmet_date?: string | null;
}

export interface UpdateBmetInput {
  pdo?: boolean;
  finger?: boolean;
  nominee?: boolean;
  bank?: boolean;
  bmet?: boolean;
  bmet_date?: string | null;
}

/**
 * Get all BMET records.
 *
 * Tenant isolation is handled by Supabase RLS.
 * tenant_id is never supplied by the frontend.
 */
export async function getBmetRecords(): Promise<BmetRecord[]> {
  const { data, error } = await supabase
    .from("bmet")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BmetRecord[];
}

/**
 * Get one BMET record.
 */
export async function getBmetRecord(
  id: string,
): Promise<BmetRecord> {
  const { data, error } = await supabase
    .from("bmet")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BmetRecord;
}

/**
 * Get BMET records for a candidate.
 */
export async function getBmetRecordsByCandidate(
  candidateId: string,
): Promise<BmetRecord[]> {
  const { data, error } = await supabase
    .from("bmet")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BmetRecord[];
}

/**
 * Create a BMET record.
 *
 * tenant_id is intentionally NOT sent.
 * It should be resolved by the database/RLS layer.
 */
export async function createBmetRecord(
  input: CreateBmetInput,
): Promise<BmetRecord> {
  const { data, error } = await supabase
    .from("bmet")
    .insert({
      candidate_id: input.candidate_id,
      pdo: input.pdo ?? false,
      finger: input.finger ?? false,
      nominee: input.nominee ?? false,
      bank: input.bank ?? false,
      bmet: input.bmet ?? false,
      bmet_date: input.bmet_date ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BmetRecord;
}

/**
 * Update a BMET record.
 */
export async function updateBmetRecord(
  id: string,
  input: UpdateBmetInput,
): Promise<BmetRecord> {
  const { data, error } = await supabase
    .from("bmet")
    .update({
      pdo: input.pdo,
      finger: input.finger,
      nominee: input.nominee,
      bank: input.bank,
      bmet: input.bmet,
      bmet_date: input.bmet_date ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BmetRecord;
}

/**
 * Delete a BMET record.
 */
export async function deleteBmetRecord(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("bmet")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}