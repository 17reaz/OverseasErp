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

export async function getAgent(
  id: string,
): Promise<Agent | null> {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function createAgent(
  name: string,
  code: string,
  tenantId: string,
  phone?: string | null,
): Promise<Agent> {
  const { data, error } = await supabase
    .from("agents")
    .insert({
      name,
      code,
      tenant_id: tenantId,
      phone: phone?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAgent(
  id: string,
  values: {
    name?: string;
    code?: string;
    phone?: string | null;
  },
): Promise<Agent> {
  const { data, error } = await supabase
    .from("agents")
    .update({
      ...values,
      ...(values.phone !== undefined && {
        phone: values.phone?.trim() || null,
      }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAgent(id: string) {
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}