import { supabase } from "@/lib/supabase/client";

export type FingerType = "fresh" | "existing";

export type FingerStatus =
  | "pending"
  | "scheduled"
  | "completed"
  | "failed"
  | "cancelled";

export interface FingerRecord {
  id: string;
  tenant_id: string;
  candidate_id: string;
  sl: number;
  finger_date: string | null;
  finger_type: FingerType;
  status: FingerStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFingerInput {
  candidate_id: string;
  finger_date?: string | null;
  finger_type?: FingerType;
  status?: FingerStatus;
  remarks?: string | null;
}

export interface UpdateFingerInput {
  finger_date?: string | null;
  finger_type?: FingerType;
  status?: FingerStatus;
  remarks?: string | null;
}

/**
 * Get all finger records.
 *
 * Tenant isolation is handled by Supabase RLS.
 * Do NOT add tenant_id from the frontend.
 */
export async function getFingerRecords(): Promise<FingerRecord[]> {
  const { data, error } = await supabase
    .from("fingers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FingerRecord[];
}

/**
 * Get finger records for one candidate.
 *
 * RLS still applies, so a candidate from another tenant
 * cannot expose another tenant's finger records.
 */
export async function getFingerRecordsByCandidate(
  candidateId: string,
): Promise<FingerRecord[]> {
  const { data, error } = await supabase
    .from("fingers")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FingerRecord[];
}

/**
 * Get one finger record.
 */
export async function getFingerRecord(
  id: string,
): Promise<FingerRecord> {
  const { data, error } = await supabase
    .from("fingers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FingerRecord;
}

/**
 * Create a finger record.
 *
 * IMPORTANT:
 * tenant_id and sl are intentionally NOT sent.
 *
 * They must be generated/assigned at database level.
 */
export async function createFingerRecord(
  input: CreateFingerInput,
): Promise<FingerRecord> {
  const { data, error } = await supabase
    .from("fingers")
    .insert({
      candidate_id: input.candidate_id,
      finger_date: input.finger_date ?? null,
      finger_type: input.finger_type ?? "fresh",
      status: input.status ?? "pending",
      remarks: input.remarks ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FingerRecord;
}

/**
 * Update a finger record.
 *
 * tenant_id and sl cannot be changed from frontend.
 */
export async function updateFingerRecord(
  id: string,
  input: UpdateFingerInput,
): Promise<FingerRecord> {
  const { data, error } = await supabase
    .from("fingers")
    .update({
      finger_date: input.finger_date,
      finger_type: input.finger_type,
      status: input.status,
      remarks: input.remarks,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FingerRecord;
}

/**
 * Delete a finger record.
 */
export async function deleteFingerRecord(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("fingers")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}