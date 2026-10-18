
import { supabase } from "@/lib/supabase/client";

export interface TradeProfession {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** Read the global Trade Profession master list. */
export async function getTradeProfessions(): Promise<TradeProfession[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("trade_professions")
    .select("id, code, name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as TradeProfession[];
}

/** Add a profession to the shared global master list. */
export async function addTradeProfession(
  code: string,
  name: string,
): Promise<TradeProfession> {
  const normalizedCode = normalizeCode(code);
  const normalizedName = normalizeName(name);

  if (!normalizedCode || !normalizedName) {
    throw new Error("Profession code and name are required.");
  }

  const { data, error } = await supabase
    .schema("core")
    .from("trade_professions")
    .insert({
      code: normalizedCode,
      name: normalizedName,
    })
    .select("id, code, name, is_active")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "This profession code or name already exists.",
      );
    }

    throw error;
  }

  return data as TradeProfession;
}

/**
 * Exact case-insensitive match for the MOFA Trade field.
 * This helper does not decide whether Takamul is required.
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
