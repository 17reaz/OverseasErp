import { supabase } from "@/lib/supabase/client";

export async function getCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return {
    data,
    error,
  };
}