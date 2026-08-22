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

export async function getFingerRecords(): Promise<FingerRecord[]> {
  const { data, error } = await supabase
    .from("finger_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FingerRecord[];
}

export async function getFingerRecordsByCandidate(
  candidateId: string,
): Promise<FingerRecord[]> {
  const { data, error } = await supabase
    .from("finger_records")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FingerRecord[];
}

export async function getFingerRecord(
  id: string,
): Promise<FingerRecord> {
  const { data, error } = await supabase
    .from("finger_records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FingerRecord;
}

export async function createFingerRecord(
  input: CreateFingerInput,
): Promise<FingerRecord> {
  const { data, error } = await supabase
    .from("finger_records")
    .insert({
      candidate_id: input.candidate_id,
      finger_date: input.finger_date ?? null,
      finger_type: input.finger_type ?? "fresh",
      status: input.status ?? "pending",
      remarks: input.remarks ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FingerRecord;
}

export async function updateFingerRecord(
  id: string,
  input: UpdateFingerInput,
): Promise<FingerRecord> {
  const { data, error } = await supabase
    .from("finger_records")
    .update({
      finger_date: input.finger_date,
      finger_type: input.finger_type,
      status: input.status,
      remarks: input.remarks,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FingerRecord;
}

export async function deleteFingerRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from("finger_records")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}