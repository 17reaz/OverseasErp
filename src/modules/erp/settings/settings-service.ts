import { supabase } from "@/lib/supabase/client";

import type {
  NumberingEntity,
  NumberingState,
} from "./settings-types";

interface TenantNumberingSettings {
  tenant_id: string;
  candidate_start_sl: number;
  agent_start_sl: number;
  agency_start_sl: number;
}

/**
 * Get current highest SL from the actual module table.
 */
async function getCurrentHighest(
  entity: NumberingEntity,
): Promise<number> {
  const tableMap: Record<NumberingEntity, string> = {
    candidate: "candidates",
    agent: "agents",
    agency: "agencies",
  };

  const { data, error } = await supabase
    .from(tableMap[entity])
    .select("sl")
    .not("sl", "is", null)
    .order("sl", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Number(data?.sl ?? 0);
}

/**
 * Get tenant numbering configuration.
 */
async function getNumberingSettings(): Promise<TenantNumberingSettings | null> {
  const { data, error } = await supabase
    .from("tenant_numbering_settings")
    .select(
      "tenant_id, candidate_start_sl, agent_start_sl, agency_start_sl",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as TenantNumberingSettings | null;
}

/**
 * Get current numbering information.
 *
 * IMPORTANT:
 * This function only reads numbering state.
 * Actual SL generation is still handled by
 * database triggers/functions.
 */
export async function getCurrentNumbering(
  entity: NumberingEntity,
): Promise<NumberingState> {
  const [currentHighest, settings] = await Promise.all([
    getCurrentHighest(entity),
    getNumberingSettings(),
  ]);

  const configuredStartMap: Record<NumberingEntity, number> = {
    candidate: Number(settings?.candidate_start_sl ?? 1),
    agent: Number(settings?.agent_start_sl ?? 1),
    agency: Number(settings?.agency_start_sl ?? 1),
  };

  const configuredStart = configuredStartMap[entity];

  const nextNumber = Math.max(
    currentHighest + 1,
    configuredStart,
  );

  return {
    entity,
    currentHighest,
    nextNumber,
  };
}

/**
 * Change the starting SL for a numbering entity.
 *
 * Safety rule:
 * New starting SL can never be lower than or equal
 * to the existing highest SL.
 */
export async function updateNumberingStart(
  entity: NumberingEntity,
  startingNumber: number,
): Promise<NumberingState> {
  if (
    !Number.isInteger(startingNumber) ||
    startingNumber < 1
  ) {
    throw new Error(
      "Starting SL must be a valid positive number.",
    );
  }

  const currentHighest = await getCurrentHighest(entity);

  if (startingNumber <= currentHighest) {
    throw new Error(
      `Starting SL must be greater than current highest SL (${currentHighest}).`,
    );
  }

  const columnMap: Record<NumberingEntity, string> = {
    candidate: "candidate_start_sl",
    agent: "agent_start_sl",
    agency: "agency_start_sl",
  };

  const column = columnMap[entity];

  const { data: existingSettings, error: settingsError } =
    await supabase
      .from("tenant_numbering_settings")
      .select(
        "tenant_id, candidate_start_sl, agent_start_sl, agency_start_sl",
      )
      .maybeSingle();

  if (settingsError) {
    throw settingsError;
  }

  if (!existingSettings) {
    const { data: tenantData, error: tenantError } =
      await supabase.rpc("get_my_tenant_id");

    if (tenantError) {
      throw tenantError;
    }

    if (!tenantData) {
      throw new Error("Unable to determine current tenant.");
    }

    const payload: Record<string, string | number> = {
      tenant_id: tenantData,
      candidate_start_sl: 1,
      agent_start_sl: 1,
      agency_start_sl: 1,
    };

    payload[column] = startingNumber;

    const { error } = await supabase
      .from("tenant_numbering_settings")
      .insert(payload);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("tenant_numbering_settings")
      .update({
        [column]: startingNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", existingSettings.tenant_id);

    if (error) {
      throw error;
    }
  }

  return {
    entity,
    currentHighest,
    nextNumber: startingNumber,
  };
}