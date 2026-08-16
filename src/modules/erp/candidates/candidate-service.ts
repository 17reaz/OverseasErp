import { supabase } from "@/lib/supabase/client";

export interface Candidate {
  id: string;
  tenant_id: string;

  passport_no: string;
  name: string;

  received_date: string | null;
  country:
    | "Saudi Arabia"
    | "Mauritius"
    | "Laos"
    | "Malaysia"
    | "Belarus"
    | null;

  created_by: string | null;
  current_stage: string | null;

  is_deleted: boolean;

  created_at: string;
  updated_at: string;

  is_returned: boolean;
  returned_date: string | null;

  sl: number | null;
  agent_id: number | null;
}

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