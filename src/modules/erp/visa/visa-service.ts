import { supabase } from "@/lib/supabase/client";

export interface Visa {
  id: string;
  tenant_id: string;
  candidate_id: string;
  mofa_id: string | null;
  sl: number;
  visa_no: string;
  visa_date: string | null;
  expiry_date: string | null;
  visa_type: string;
  status: string;
  agency_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export type VisaInput = {
  candidate_id: string;
  mofa_id?: string | null;
  visa_no: string;
  visa_date?: string | null;
  expiry_date?: string | null;
  visa_type?: string;
  status?: string;
  agency_id?: string | null;
  remarks?: string | null;
};

export async function getVisas(): Promise<Visa[]> {
  const { data, error } = await supabase
    .from("visas")
    .select("*")
    .order("sl", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createVisa(input: VisaInput): Promise<Visa> {
  const { data, error } = await supabase
    .from("visas")
    .insert([input])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateVisa(
  id: string,
  input: Partial<VisaInput>,
): Promise<Visa> {
  const { data, error } = await supabase
    .from("visas")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteVisa(id: string): Promise<void> {
  const { error } = await supabase
    .from("visas")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}