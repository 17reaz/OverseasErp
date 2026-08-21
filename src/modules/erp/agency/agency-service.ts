import {
  supabase,
} from "@/lib/supabase/client";


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface Agency {
  id: string;

  tenant_id: string;

  sl: number;

  name: string;

  code: string;

  phone: string | null;

  email: string | null;

  address: string | null;

  is_active: boolean;

  created_at: string;

  updated_at: string;
}


/*
 * =========================================================
 * CREATE / UPDATE INPUT
 * =========================================================
 */

export interface AgencyInput {
  name: string;

  code: string;

  phone?: string | null;

  email?: string | null;

  address?: string | null;

  is_active?: boolean;
}


/*
 * =========================================================
 * GET AGENCIES
 *
 * RLS will automatically restrict this query
 * to the authenticated user's tenant.
 * =========================================================
 */

export async function getAgencies(): Promise<Agency[]> {
  const {
    data,
    error,
  } = await supabase
    .from("agencies")
    .select("*")
    .order("sl", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as Agency[];
}


/*
 * =========================================================
 * GET SINGLE AGENCY
 * =========================================================
 */

export async function getAgency(
  id: string,
): Promise<Agency> {
  const {
    data,
    error,
  } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data as Agency;
}


/*
 * =========================================================
 * CREATE AGENCY
 *
 * tenant_id is intentionally NOT accepted from the form.
 *
 * It should come from the authenticated user's profile /
 * existing tenant context.
 * =========================================================
 */

export async function createAgency(
  tenantId: string,
  input: AgencyInput,
): Promise<Agency> {

  const {
    data,
    error,
  } = await supabase
    .from("agencies")
    .insert({
      tenant_id: tenantId,

      name:
        input.name.trim(),

      code:
        input.code.trim(),

      phone:
        input.phone?.trim() ||
        null,

      email:
        input.email?.trim() ||
        null,

      address:
        input.address?.trim() ||
        null,

      is_active:
        input.is_active ??
        true,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Agency;
}


/*
 * =========================================================
 * UPDATE AGENCY
 * =========================================================
 */

export async function updateAgency(
  id: string,
  input: AgencyInput,
): Promise<Agency> {

  const {
    data,
    error,
  } = await supabase
    .from("agencies")
    .update({
      name:
        input.name.trim(),

      code:
        input.code.trim(),

      phone:
        input.phone?.trim() ||
        null,

      email:
        input.email?.trim() ||
        null,

      address:
        input.address?.trim() ||
        null,

      is_active:
        input.is_active ??
        true,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Agency;
}


/*
 * =========================================================
 * DELETE AGENCY
 * =========================================================
 */

export async function deleteAgency(
  id: string,
): Promise<void> {

  const {
    error,
  } = await supabase
    .from("agencies")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}


/*
 * =========================================================
 * TOGGLE AGENCY STATUS
 * =========================================================
 */

export async function updateAgencyStatus(
  id: string,
  isActive: boolean,
): Promise<Agency> {

  const {
    data,
    error,
  } = await supabase
    .from("agencies")
    .update({
      is_active:
        isActive,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Agency;
}