import { supabase } from "@/lib/supabase/client";

import type {
  CreatePartyInput,
  FinanceParty,
  FinancePartyType,
  UpdatePartyInput,
} from "./party-types";

type PartyRow = {
  id: string;
  tenant_id: string;
  party_type: FinancePartyType;
  party_id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapParty(row: PartyRow): FinanceParty {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    partyType: row.party_type,
    partyId: row.party_id,
    name: row.name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getParties(): Promise<FinanceParty[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("parties")
    .select(
      `
        id,
        tenant_id,
        party_type,
        party_id,
        name,
        phone,
        is_active,
        created_at,
        updated_at
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PartyRow[]).map(mapParty);
}

export async function getPartiesByType(
  partyType: FinancePartyType,
): Promise<FinanceParty[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("parties")
    .select(
      `
        id,
        tenant_id,
        party_type,
        party_id,
        name,
        phone,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("party_type", partyType)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PartyRow[]).map(mapParty);
}

export async function getParty(
  partyId: string,
): Promise<FinanceParty | null> {
  const { data, error } = await supabase
    .schema("finance")
    .from("parties")
    .select(
      `
        id,
        tenant_id,
        party_type,
        party_id,
        name,
        phone,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("id", partyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapParty(data as PartyRow) : null;
}

export async function createParty(
  input: CreatePartyInput,
): Promise<FinanceParty> {
  const { data, error } = await supabase
    .schema("finance")
    .from("parties")
    .insert({
      party_type: input.partyType,
      party_id: input.partyId,
      name: input.name,
      phone: input.phone ?? null,
      is_active: input.isActive ?? true,
    })
    .select(
      `
        id,
        tenant_id,
        party_type,
        party_id,
        name,
        phone,
        is_active,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapParty(data as PartyRow);
}

export async function updateParty(
  partyId: string,
  input: UpdatePartyInput,
): Promise<FinanceParty> {
  const { data, error } = await supabase
    .schema("finance")
    .from("parties")
    .update({
      ...(input.name !== undefined && {
        name: input.name,
      }),
      ...(input.phone !== undefined && {
        phone: input.phone,
      }),
      ...(input.isActive !== undefined && {
        is_active: input.isActive,
      }),
    })
    .eq("id", partyId)
    .select(
      `
        id,
        tenant_id,
        party_type,
        party_id,
        name,
        phone,
        is_active,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapParty(data as PartyRow);
}
export async function getPartyBySource(
  partyType: FinancePartyType,
  partyId: string,
): Promise<FinanceParty | null> {
  const { data, error } = await supabase
    .schema("finance")
    .from("parties")
    .select(
      `
        id,
        tenant_id,
        party_type,
        party_id,
        name,
        phone,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("party_type", partyType)
    .eq("party_id", partyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapParty(data as PartyRow) : null;
}
export async function deleteParty(
  partyId: string,
): Promise<void> {
  const { error } = await supabase
    .schema("finance")
    .from("parties")
    .delete()
    .eq("id", partyId);

  if (error) {
    throw new Error(error.message);
  }
}
export async function setPartyActive(
  id: string,
  isActive: boolean,
): Promise<FinanceParty> {
  const { data, error } = await supabase
    .schema("finance")
    .from("parties")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      `
        id,
        tenant_id,
        party_type,
        party_id,
        name,
        phone,
        is_active,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapParty(data as PartyRow);
}