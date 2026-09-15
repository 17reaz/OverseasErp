// src/modules/erp/finance/fixed-costs/fixed-costs-service.ts

import { supabase } from "@/lib/supabase/client";

export type FixedCostFrequency =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type FixedCostStatus =
  | "active"
  | "paused"
  | "cancelled";

export interface FixedCost {
  id: string;
  tenantId: string;

  name: string;
  categoryId: string | null;

  amount: number;
  frequency: FixedCostFrequency;

  startDate: string;
  nextDueDate: string | null;

  accountId: string | null;
  vendorId: string | null;

  status: FixedCostStatus;

  description: string | null;

  createdAt: string;
  updatedAt: string;
}

interface FixedCostRow {
  id: string;
  tenant_id: string;

  name: string;
  category_id: string | null;

  amount: number | string;
  frequency: string;

  start_date: string;
  next_due_date: string | null;

  account_id: string | null;
  vendor_id: string | null;

  status: string;

  description: string | null;

  created_at: string;
  updated_at: string;
}

/* =========================================================
 * GET FIXED COSTS
 * ========================================================= */

export async function getFixedCosts(): Promise<
  FixedCost[]
> {
  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .select(
      `
        id,
        tenant_id,
        name,
        category_id,
        amount,
        frequency,
        start_date,
        next_due_date,
        account_id,
        vendor_id,
        status,
        description,
        created_at,
        updated_at
      `,
    )
    .order("next_due_date", {
      ascending: true,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data as FixedCostRow[] | null) ?? []
  ).map(normalizeFixedCost);
}

/* =========================================================
 * GET SINGLE FIXED COST
 * ========================================================= */

export async function getFixedCost(
  id: string,
): Promise<FixedCost> {
  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .select(
      `
        id,
        tenant_id,
        name,
        category_id,
        amount,
        frequency,
        start_date,
        next_due_date,
        account_id,
        vendor_id,
        status,
        description,
        created_at,
        updated_at
      `,
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeFixedCost(
    data as FixedCostRow,
  );
}

/* =========================================================
 * NORMALIZER
 * ========================================================= */

function normalizeFixedCost(
  row: FixedCostRow,
): FixedCost {
  return {
    id: row.id,
    tenantId: row.tenant_id,

    name: row.name,
    categoryId: row.category_id,

    amount: Number(row.amount),
    frequency:
      row.frequency as FixedCostFrequency,

    startDate: row.start_date,
    nextDueDate: row.next_due_date,

    accountId: row.account_id,
    vendorId: row.vendor_id,

    status:
      row.status as FixedCostStatus,

    description: row.description,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
