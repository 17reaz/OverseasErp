import { supabase } from "@/lib/supabase/client";

export interface TenantCountry {
  name: string;
  enabled: boolean;
}

export const DEFAULT_COUNTRIES: TenantCountry[] = [
  {
    name: "Saudi Arabia",
    enabled: true,
  },
  {
    name: "Mauritius",
    enabled: true,
  },
  {
    name: "Laos",
    enabled: true,
  },
  {
    name: "Malaysia",
    enabled: true,
  },
  {
    name: "Belarus",
    enabled: true,
  },
];

interface TenantSettingsRow {
  id: string;
  tenant_id: string;
  countries: unknown;
}

function normalizeCountries(value: unknown): TenantCountry[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_COUNTRIES];
  }

  const normalized: TenantCountry[] = [];

  for (const item of value) {
    // New format:
    // { name: "Saudi Arabia", enabled: true }
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { name?: unknown }).name === "string" &&
      typeof (item as { enabled?: unknown }).enabled === "boolean"
    ) {
      const name = (item as { name: string }).name.trim();

      if (name.length > 0) {
        normalized.push({
          name,
          enabled: (item as { enabled: boolean }).enabled,
        });
      }

      continue;
    }

    // Backward compatibility:
    // ["Saudi Arabia", "Mauritius"]
    if (typeof item === "string") {
      const name = item.trim();

      if (name.length > 0) {
        normalized.push({
          name,
          enabled: true,
        });
      }
    }
  }

  return normalized.length > 0
    ? normalized
    : [...DEFAULT_COUNTRIES];
}

function normalizeForSave(
  countries: TenantCountry[],
): TenantCountry[] {
  const seen = new Set<string>();
  const result: TenantCountry[] = [];

  for (const country of countries) {
    const name = country.name.trim();

    if (!name) {
      continue;
    }

    const key = name.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    result.push({
      name,
      enabled: Boolean(country.enabled),
    });
  }

  return result;
}

async function getCurrentTenantId(): Promise<string> {
  const { data, error } = await supabase.rpc(
    "get_my_tenant_id",
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Unable to determine current tenant.",
    );
  }

  return data;
}

export async function getTenantCountries(): Promise<TenantCountry[]> {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .schema("core")
    .from("tenant_settings")
    .select("id, tenant_id, countries")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return [...DEFAULT_COUNTRIES];
  }

  const row = data as TenantSettingsRow;

  return normalizeCountries(row.countries);
}

export async function saveTenantCountries(
  countries: TenantCountry[],
): Promise<TenantCountry[]> {
  const tenantId = await getCurrentTenantId();

  const normalizedCountries =
    normalizeForSave(countries);

  const { data: existingSettings, error: existingError } =
    await supabase
      .schema("core")
      .from("tenant_settings")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingSettings) {
    const { error } = await supabase
      .schema("core")
      .from("tenant_settings")
      .update({
        countries: normalizedCountries,
      })
      .eq("tenant_id", tenantId);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .schema("core")
      .from("tenant_settings")
      .insert({
        tenant_id: tenantId,
        countries: normalizedCountries,
      });

    if (error) {
      throw error;
    }
  }

  return normalizedCountries;
}