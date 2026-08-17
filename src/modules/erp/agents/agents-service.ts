import { supabase } from "@/lib/supabase/client";

import type { Agent } from "./types";

export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createAgent(
  name: string,
  code: string,
  tenantId: string,
): Promise<Agent> {
  const { data, error } = await supabase
    .from("agents")
    .insert({
      name,
      code,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAgent(id: number) {
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}