import { supabase } from "@/lib/supabase/client";

import type {
  NumberingEntity,
  NumberingState,
} from "./settings-types";

/**
 * Settings service
 *
 * IMPORTANT:
 * This service does NOT generate SL.
 * Existing database triggers remain responsible
 * for actual numbering.
 */

export async function getCurrentNumbering(
  entity: NumberingEntity,
): Promise<NumberingState> {
  const tableMap: Record<NumberingEntity, string> = {
    candidate: "candidates",
    agent: "agents",
    agency: "agencies",
  };

  const table = tableMap[entity];

  const { data, error } = await supabase
    .from(table)
    .select("sl")
    .not("sl", "is", null)
    .order("sl", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const currentHighest = Number(data?.sl ?? 0);

  return {
    entity,
    currentHighest,
    nextNumber: currentHighest + 1,
  };
}