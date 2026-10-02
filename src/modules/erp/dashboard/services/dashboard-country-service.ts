import { supabase } from "@/lib/supabase/client";

export interface DashboardCountryPassport {
  country: string;
  passports: number;
}

export async function getDashboardCountryPassportData(): Promise<
  DashboardCountryPassport[]
> {
  const { data, error } = await supabase
    .from("candidates")
    .select("country, passport_no")
    .eq("is_deleted", false)
    .eq("is_returned", false)
    .is("final_status", null);

  if (error) {
    throw error;
  }

  const countryMap = new Map<string, number>();

  for (const row of data ?? []) {
    const country =
      typeof row.country === "string"
        ? row.country.trim()
        : "";

    const passport =
      typeof row.passport_no === "string"
        ? row.passport_no.trim()
        : "";

    // Country অথবা passport না থাকলে dashboard-এ দেখাবো না
    if (!country || !passport) {
      continue;
    }

    countryMap.set(
      country,
      (countryMap.get(country) ?? 0) + 1,
    );
  }

  return Array.from(countryMap.entries())
    .map(([country, passports]) => ({
      country,
      passports,
    }))
    .sort(
      (a, b) =>
        b.passports - a.passports ||
        a.country.localeCompare(b.country),
    );
}