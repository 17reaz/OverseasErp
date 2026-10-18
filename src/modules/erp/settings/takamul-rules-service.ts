
import { supabase } from "@/lib/supabase/client";

async function getCurrentTenantId(): Promise<string> {
  const { data, error } = await supabase.rpc("get_my_tenant_id");

  if (error) throw error;

  if (!data) {
    throw new Error("Unable to determine current tenant.");
  }

  return data;
}

function normalizeTrades(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;

    const trade = item.trim();
    const key = trade.toLocaleLowerCase();

    if (!trade || seen.has(key)) continue;

    seen.add(key);
    result.push(trade);
  }

  return result;
}

export async function getTakamulRequiredTrades(): Promise<string[]> {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .schema("core")
    .from("tenant_settings")
    .select("takamul_required_trades")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;

  return normalizeTrades(data?.takamul_required_trades);
}

export async function saveTakamulRequiredTrades(
  trades: string[],
): Promise<string[]> {
  const tenantId = await getCurrentTenantId();
  const normalized = normalizeTrades(trades);

  const { data: existing, error: lookupError } = await supabase
    .schema("core")
    .from("tenant_settings")
    .select("id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing) {
    const { error } = await supabase
      .schema("core")
      .from("tenant_settings")
      .update({ takamul_required_trades: normalized })
      .eq("tenant_id", tenantId);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .schema("core")
      .from("tenant_settings")
      .insert({
        tenant_id: tenantId,
        takamul_required_trades: normalized,
      });

    if (error) throw error;
  }

  return normalized;
}

/**
 * Exact case-insensitive match.
 * No fuzzy matching: similar profession names should not
 * accidentally make Takamul mandatory.
 */
export function isTakamulRequiredForTrade(
  trade: string | null | undefined,
  requiredTrades: string[],
): boolean {
  const normalizedTrade = trade?.trim().toLocaleLowerCase();

  if (!normalizedTrade) return false;

  return requiredTrades.some(
    (item) => item.trim().toLocaleLowerCase() === normalizedTrade,
  );
}
